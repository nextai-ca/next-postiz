import {
  AuthTokenDetails,
  ClientInformation,
  FetchPageInformationResult,
  PostDetails,
  PostResponse,
  SocialProvider,
} from '@gitroom/nestjs-libraries/integrations/social/social.integrations.interface';
import { SocialAbstract } from '@gitroom/nestjs-libraries/integrations/social.abstract';
import dayjs from 'dayjs';
import { Integration } from '@prisma/client';
import { makeId } from '@gitroom/nestjs-libraries/services/make.is';
import { NextChatBlogDto } from '@gitroom/nestjs-libraries/dtos/posts/providers-settings/nextchat-blog.dto';
import { Tool } from '@gitroom/nestjs-libraries/integrations/tool.decorator';

export class NextChatBlogProvider extends SocialAbstract implements SocialProvider {
  override maxConcurrentJob = 5; // NextChat blog has moderate publishing limits
  identifier = 'nextchat-blog';
  name = 'NextChat Blog';
  isBetweenSteps = false; // Bot selection happens on NextChat side, botConfigId comes in callback
  scopes = [] as string[]; // OAuth scopes are handled by NextChat platform
  editor = 'html' as const;
  dto = NextChatBlogDto;
  maxLength() {
    return 100000;
  }

  /**
   * Generate OAuth 2.0 authorization URL
   * Adds connector=blog parameter so NextChat knows to show bot selection page
   */
  async generateAuthUrl(clientInformation?: ClientInformation) {
    const state = makeId(16);
    const baseUrl = clientInformation?.instanceUrl || process.env.NEXTCHAT_API_URL || process.env.NEXTCHAT_OAUTH_URL || 'https://nextchat.com';
    const clientId = clientInformation?.client_id || process.env.NEXTCHAT_BLOG_CLIENT_ID || '';
    const redirectUri = `${process.env.FRONTEND_URL}/integrations/social/nextchat-blog`;

    // Build OAuth authorization URL with connector=blog parameter
    const authUrl = new URL(`${baseUrl}/api/oauth/authorize`);
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'blog:read blog:write');
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('connector', 'blog'); // Tell NextChat this is for blog connector

    return {
      url: authUrl.toString(),
      codeVerifier: makeId(10),
      state,
    };
  }

  async refreshToken(refreshToken: string): Promise<AuthTokenDetails> {
    const baseUrl = process.env.NEXTCHAT_API_URL || process.env.NEXTCHAT_OAUTH_URL || 'https://nextchat.com';
    const clientId = process.env.NEXTCHAT_BLOG_CLIENT_ID || '';
    const clientSecret = process.env.NEXTCHAT_BLOG_CLIENT_SECRET || '';

    try {
      const response = await this.fetch(`${baseUrl}/api/oauth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: clientId,
          client_secret: clientSecret,
        }),
      });

      const tokens = await response.json();

      if (!tokens.access_token) {
        throw new Error('No access token received');
      }

      // Get user info with new access token
      const userInfoResponse = await this.fetch(`${baseUrl}/api/oauth/userinfo`, {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      });

      if (!userInfoResponse.ok) {
        throw new Error('Failed to get user info');
      }

      const userInfo = await userInfoResponse.json();

      return {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || refreshToken,
        expiresIn: tokens.expires_in || 3600,
        id: userInfo.id || userInfo.accountId || userInfo.sub || '',
        name: userInfo.name || userInfo.email || 'NextChat User',
        picture: userInfo.picture || userInfo.avatar || '',
        username: userInfo.username || userInfo.email || userInfo.preferred_username || '',
      };
    } catch (err) {
      console.error('Failed to refresh NextChat token:', err);
      return {
        refreshToken: '',
        expiresIn: 0,
        accessToken: '',
        id: '',
        name: '',
        picture: '',
        username: '',
      };
    }
  }

  /**
   * Authenticate using OAuth 2.0 code
   * Exchange authorization code for access token
   * If botConfigId is provided, fetch bot information and use botConfigId as the integration ID
   */
  async authenticate(
    params: {
      code: string;
      codeVerifier: string;
      refresh?: string;
      botConfigId?: string;
    },
    clientInformation?: ClientInformation
  ): Promise<AuthTokenDetails | string> {
    const baseUrl = clientInformation?.instanceUrl || process.env.NEXTCHAT_API_URL || 'https://nextchat.com';
    const clientId = clientInformation?.client_id || process.env.NEXTCHAT_BLOG_CLIENT_ID || '';
    const clientSecret = clientInformation?.client_secret || process.env.NEXTCHAT_BLOG_CLIENT_SECRET || '';
    const redirectUri = `${process.env.FRONTEND_URL}/integrations/social/nextchat-blog`;

    try {
      // Exchange authorization code for access token
      // According to NextChat API docs, token endpoint uses JSON body
      const tokenResponse = await this.fetch(`${baseUrl}/api/oauth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          grant_type: 'authorization_code',
          code: params.code,
          redirect_uri: redirectUri,
          client_id: clientId,
          client_secret: clientSecret,
        }),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error('Token exchange failed:', errorText);
        return 'Invalid authorization code';
      }

      const tokens = await tokenResponse.json();

      if (!tokens.access_token) {
        return 'No access token received';
      }

      // If botConfigId is provided, fetch bot information
      if (params.botConfigId) {
        const botsResponse = await this.fetch(`${baseUrl}/api/oauth/bots`, {
          headers: {
            Authorization: `Bearer ${tokens.access_token}`,
          },
        });

        if (!botsResponse.ok) {
          return 'Failed to fetch bot information';
        }

        const botsData = await botsResponse.json();
        const bots = botsData.bots || [];
        const selectedBot = bots.find((bot: any) => bot.botConfigId === params.botConfigId);

        if (!selectedBot) {
          return 'Selected bot config not found or access denied';
        }

        // Return bot information with botConfigId as the ID
        return {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token || '',
          expiresIn: tokens.expires_in || 3600,
          id: selectedBot.botConfigId, // Use botConfigId as the integration ID
          name: selectedBot.name || 'NextChat Blog',
          picture: '',
          username: selectedBot.websiteUrl || selectedBot.botConfigId,
        };
      }

      // If no botConfigId, get user information (fallback for backward compatibility)
      const userInfoResponse = await this.fetch(`${baseUrl}/api/oauth/userinfo`, {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      });

      if (!userInfoResponse.ok) {
        return 'Failed to get user information';
      }

      const userInfo = await userInfoResponse.json();

      return {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || '',
        expiresIn: tokens.expires_in || 3600,
        id: userInfo.id || userInfo.accountId || userInfo.sub || makeId(10),
        name: userInfo.name || userInfo.email || 'NextChat User',
        picture: userInfo.picture || userInfo.avatar || '',
        username: userInfo.username || userInfo.email || userInfo.preferred_username || '',
      };
    } catch (err) {
      console.error('NextChat authentication error:', err);
      return 'Invalid credentials or network error';
    }
  }

  /**
   * Fetch page information (bot selection)
   * This is called when isBetweenSteps is true and user needs to select a botConfigId
   * data.botConfigId contains the selected bot configuration ID
   */
  async fetchPageInformation(
    accessToken: string,
    data: { botConfigId: string }
  ): Promise<FetchPageInformationResult> {
    const baseUrl = process.env.NEXTCHAT_API_URL || 'https://nextchat.com';

    try {
      // Get bot information to verify and get details
      const botsResponse = await this.fetch(`${baseUrl}/api/oauth/bots`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!botsResponse.ok) {
        throw new Error('Failed to fetch bots');
      }

      const botsData = await botsResponse.json();
      const bots = botsData.bots || [];
      const selectedBot = bots.find((bot: any) => bot.botConfigId === data.botConfigId);

      if (!selectedBot) {
        throw new Error('Selected bot config not found or access denied');
      }

      // Return bot information
      // The id will be used as internalId in the integration
      // The access_token will be stored as the token
      return {
        id: selectedBot.botConfigId,
        name: selectedBot.name || 'NextChat Blog',
        access_token: accessToken, // Keep the same access token
        picture: '', // No picture available from API
        username: selectedBot.websiteUrl || selectedBot.botConfigId,
      };
    } catch (err) {
      console.error('Failed to fetch page information:', err);
      throw err;
    }
  }

  /**
   * Get list of bots/websites that have blog enabled
   * This is used as a tool to help users select which bot to connect
   */
  @Tool({
    description: 'Get list of bots/websites with blog enabled',
    dataSchema: [],
  })
  async getBots(accessToken: string) {
    const baseUrl = process.env.NEXTCHAT_API_URL || 'https://nextchat.com';
    
    try {
      const response = await this.fetch(`${baseUrl}/api/oauth/bots`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch bots: ${response.statusText}`);
      }

      const data = await response.json();
      return data.bots || [];
    } catch (err) {
      console.error('Failed to fetch NextChat bots:', err);
      return [];
    }
  }

  /**
   * Get list of tags for a specific bot
   */
  @Tool({
    description: 'Get list of tags for a bot',
    dataSchema: [
      {
        key: 'botConfigId',
        type: 'string',
        description: 'The bot configuration ID',
      },
    ],
  })
  async getTags(accessToken: string, data: { botConfigId: string }) {
    const baseUrl = process.env.NEXTCHAT_API_URL || 'https://nextchat.com';
    
    try {
      const response = await this.fetch(
        `${baseUrl}/api/oauth/bots/${data.botConfigId}/blog/tags`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch tags: ${response.statusText}`);
      }

      const result = await response.json();
      return result.tags || [];
    } catch (err) {
      console.error('Failed to fetch NextChat tags:', err);
      return [];
    }
  }

  /**
   * Post blog article to NextChat
   */
  async post(
    id: string,
    accessToken: string,
    postDetails: PostDetails<NextChatBlogDto>[],
    integration: Integration
  ): Promise<PostResponse[]> {
    const firstPost = postDetails?.[0];
    if (!firstPost) {
      throw new Error('No post details provided');
    }

    const settings = firstPost.settings as NextChatBlogDto;
    const baseUrl = process.env.NEXTCHAT_API_URL || 'https://nextchat.com';

    if (!settings?.botConfigId) {
      throw new Error('botConfigId is required');
    }

    const requestBody: any = {
      title: settings.title,
      content: firstPost.message,
      status: settings.status || 'published',
    };

    // Add optional fields
    if (settings.tagIds && settings.tagIds.length > 0) {
      requestBody.tagIds = settings.tagIds;
    }

    if (settings.metaDescription) {
      requestBody.metaDescription = settings.metaDescription;
    }

    if (settings.featuredImage) {
      requestBody.featuredImage = settings.featuredImage;
    }

    if (settings.publishedAt) {
      requestBody.publishedAt = settings.publishedAt;
    }

    // Handle featured image from media
    if (settings.main_image?.path) {
      requestBody.featuredImage = settings.main_image.path;
    }

    try {
      const response = await this.fetch(
        `${baseUrl}/api/oauth/bots/${settings.botConfigId}/blog/posts`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create blog post: ${errorText}`);
      }

      const result = await response.json();

      // Get the post ID from the response
      const postId = result.insertedId || result.id || result._id;
      if (!postId) {
        throw new Error('No post ID received from NextChat API');
      }

      // Construct the blog post URL
      // The URL format depends on NextChat's blog structure
      const blogPostUrl = settings.websiteUrl
        ? `${settings.websiteUrl}/blog/${postId}`
        : `${baseUrl}/blog/${postId}`;

      return [
        {
          id: firstPost.id,
          status: 'completed',
          postId: String(postId),
          releaseURL: blogPostUrl,
        },
      ];
    } catch (err) {
      console.error('Failed to post to NextChat blog:', err);
      throw err;
    }
  }
}

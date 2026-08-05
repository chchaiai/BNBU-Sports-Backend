import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  Inject,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import type { AuthenticatedPrincipal } from '../../common/http/request-context.js';
import { OperationPolicy } from '../../common/policy/operation-policy.decorator.js';
import { CurrentPrincipal } from '../../common/policy/principal.decorator.js';
import {
  AccountRecoveryCompletionRequestDto,
  AccountRecoveryRequestDto,
  AppendLocationSamplesRequestDto,
  ClientPlatformQueryDto,
  CreateExemptionApplicationRequestDto,
  CreateFeedbackRequestDto,
  ExemptionApplicationListQueryDto,
  ExemptionApplicationPathDto,
  FeedbackListQueryDto,
  FeedbackPathDto,
  FinalizeLocationTrackRequestDto,
  HelpArticleListQueryDto,
  HelpArticlePathDto,
  NotificationListQueryDto,
  NotificationPathDto,
  PushDevicePathDto,
  PushDeviceRegistrationRequestDto,
  RecordLocationPathDto,
  ReviewExemptionApplicationRequestDto,
  SessionLocationPathDto,
  StartLocationTrackRequestDto,
  StudentSignInCodeRequestDto,
  StudentSignInCodeVerificationRequestDto,
  UpdateExemptionApplicationRequestDto,
  UpdateLocationPrivacyPolicyRequestDto,
  UpdateUserPreferencesRequestDto,
  VersionedRequestDto,
} from './client-capabilities.dto.js';
import { ClientCapabilitiesService } from './client-capabilities.service.js';

@Controller()
export class ClientCapabilitiesController {
  constructor(
    @Inject(ClientCapabilitiesService)
    private readonly capabilities: ClientCapabilitiesService,
  ) {}

  @Post('auth/student-sign-in-codes')
  @OperationPolicy('requestStudentSignInCode')
  requestStudentSignInCode(@Body() body: StudentSignInCodeRequestDto): never {
    void body;
    return this.capabilities.deny();
  }

  @Post('auth/student-sign-in-codes/verify')
  @OperationPolicy('verifyStudentSignInCode')
  verifyStudentSignInCode(@Body() body: StudentSignInCodeVerificationRequestDto): never {
    void body;
    return this.capabilities.deny();
  }

  @Post('auth/account-recovery-requests')
  @OperationPolicy('requestAccountRecovery')
  requestAccountRecovery(@Body() body: AccountRecoveryRequestDto): never {
    void body;
    return this.capabilities.deny();
  }

  @Post('auth/account-recovery-requests/complete')
  @OperationPolicy('completeAccountRecovery')
  completeAccountRecovery(@Body() body: AccountRecoveryCompletionRequestDto): never {
    void body;
    return this.capabilities.deny();
  }

  @Get('notifications')
  @OperationPolicy('listNotifications')
  listNotifications(
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
    @Query() query: NotificationListQueryDto,
  ): never {
    void query;
    return this.capabilities.deny(principal);
  }

  @Post('notifications/:notificationId/read')
  @OperationPolicy('markNotificationRead')
  markNotificationRead(
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
    @Param() path: NotificationPathDto,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
  ): never {
    void path;
    void idempotencyKey;
    return this.capabilities.deny(principal);
  }

  @Post('push-devices')
  @OperationPolicy('registerPushDevice')
  registerPushDevice(
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
    @Body() body: PushDeviceRegistrationRequestDto,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
  ): never {
    void body;
    void idempotencyKey;
    return this.capabilities.deny(principal);
  }

  @Delete('push-devices/:deviceId')
  @OperationPolicy('unregisterPushDevice')
  unregisterPushDevice(
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
    @Param() path: PushDevicePathDto,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
  ): never {
    void path;
    void idempotencyKey;
    return this.capabilities.deny(principal);
  }

  @Get('me/preferences')
  @OperationPolicy('getCurrentUserPreferences')
  getCurrentUserPreferences(@CurrentPrincipal() principal: AuthenticatedPrincipal): never {
    return this.capabilities.deny(principal);
  }

  @Patch('me/preferences')
  @OperationPolicy('updateCurrentUserPreferences')
  updateCurrentUserPreferences(
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
    @Body() body: UpdateUserPreferencesRequestDto,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
  ): never {
    void body;
    void idempotencyKey;
    return this.capabilities.deny(principal);
  }

  @Get('help-articles')
  @OperationPolicy('listHelpArticles')
  listHelpArticles(@Query() query: HelpArticleListQueryDto): never {
    void query;
    return this.capabilities.deny();
  }

  @Get('help-articles/:articleId')
  @OperationPolicy('getHelpArticle')
  getHelpArticle(@Param() path: HelpArticlePathDto): never {
    void path;
    return this.capabilities.deny();
  }

  @Post('feedback')
  @OperationPolicy('createFeedback')
  createFeedback(
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
    @Body() body: CreateFeedbackRequestDto,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
  ): never {
    void body;
    void idempotencyKey;
    return this.capabilities.deny(principal);
  }

  @Get('feedback')
  @OperationPolicy('listFeedback')
  listFeedback(
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
    @Query() query: FeedbackListQueryDto,
  ): never {
    void query;
    return this.capabilities.deny(principal);
  }

  @Get('feedback/:feedbackId')
  @OperationPolicy('getFeedback')
  getFeedback(
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
    @Param() path: FeedbackPathDto,
  ): never {
    void path;
    return this.capabilities.deny(principal);
  }

  @Get('exemption-applications')
  @OperationPolicy('listExemptionApplications')
  listExemptionApplications(
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
    @Query() query: ExemptionApplicationListQueryDto,
  ): never {
    void query;
    return this.capabilities.deny(principal);
  }

  @Post('exemption-applications')
  @OperationPolicy('createExemptionApplication')
  createExemptionApplication(
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
    @Body() body: CreateExemptionApplicationRequestDto,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
  ): never {
    void body;
    void idempotencyKey;
    return this.capabilities.deny(principal);
  }

  @Get('exemption-applications/:applicationId')
  @OperationPolicy('getExemptionApplication')
  getExemptionApplication(
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
    @Param() path: ExemptionApplicationPathDto,
  ): never {
    void path;
    return this.capabilities.deny(principal);
  }

  @Patch('exemption-applications/:applicationId')
  @OperationPolicy('updateExemptionApplication')
  updateExemptionApplication(
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
    @Param() path: ExemptionApplicationPathDto,
    @Body() body: UpdateExemptionApplicationRequestDto,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
  ): never {
    void path;
    void body;
    void idempotencyKey;
    return this.capabilities.deny(principal);
  }

  @Post('exemption-applications/:applicationId/submit')
  @OperationPolicy('submitExemptionApplication')
  submitExemptionApplication(
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
    @Param() path: ExemptionApplicationPathDto,
    @Body() body: VersionedRequestDto,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
  ): never {
    void path;
    void body;
    void idempotencyKey;
    return this.capabilities.deny(principal);
  }

  @Post('exemption-applications/:applicationId/review')
  @OperationPolicy('reviewExemptionApplication')
  reviewExemptionApplication(
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
    @Param() path: ExemptionApplicationPathDto,
    @Body() body: ReviewExemptionApplicationRequestDto,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
  ): never {
    void path;
    void body;
    void idempotencyKey;
    return this.capabilities.deny(principal);
  }

  @Get('app-release-policy')
  @OperationPolicy('getAppReleasePolicy')
  getAppReleasePolicy(@Query() query: ClientPlatformQueryDto): never {
    void query;
    return this.capabilities.deny();
  }

  @Get('sport-catalog')
  @OperationPolicy('getSportCatalog')
  getSportCatalog(@CurrentPrincipal() principal: AuthenticatedPrincipal): never {
    return this.capabilities.deny(principal);
  }

  @Get('activity-conversion-rules')
  @OperationPolicy('getActivityConversionRules')
  getActivityConversionRules(@CurrentPrincipal() principal: AuthenticatedPrincipal): never {
    return this.capabilities.deny(principal);
  }

  @Post('exercise-sessions/:sessionId/location-track')
  @OperationPolicy('startExerciseLocationTrack')
  startExerciseLocationTrack(
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
    @Param() path: SessionLocationPathDto,
    @Body() body: StartLocationTrackRequestDto,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
  ): never {
    void path;
    void body;
    void idempotencyKey;
    return this.capabilities.deny(principal);
  }

  @Post('exercise-sessions/:sessionId/location-samples')
  @OperationPolicy('appendExerciseLocationSamples')
  appendExerciseLocationSamples(
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
    @Param() path: SessionLocationPathDto,
    @Body() body: AppendLocationSamplesRequestDto,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
  ): never {
    void path;
    void body;
    void idempotencyKey;
    return this.capabilities.deny(principal);
  }

  @Post('exercise-sessions/:sessionId/location-track/finalize')
  @OperationPolicy('finalizeExerciseLocationTrack')
  finalizeExerciseLocationTrack(
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
    @Param() path: SessionLocationPathDto,
    @Body() body: FinalizeLocationTrackRequestDto,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
  ): never {
    void path;
    void body;
    void idempotencyKey;
    return this.capabilities.deny(principal);
  }

  @Get('exercise-records/:recordId/location-summary')
  @OperationPolicy('getExerciseRecordLocationSummary')
  getExerciseRecordLocationSummary(
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
    @Param() path: RecordLocationPathDto,
  ): never {
    void path;
    return this.capabilities.deny(principal);
  }

  @Get('location-privacy-policy')
  @OperationPolicy('getLocationPrivacyPolicy')
  getLocationPrivacyPolicy(@CurrentPrincipal() principal: AuthenticatedPrincipal): never {
    return this.capabilities.deny(principal);
  }

  @Patch('location-privacy-policy')
  @HttpCode(200)
  @OperationPolicy('updateLocationPrivacyPolicy')
  updateLocationPrivacyPolicy(
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
    @Body() body: UpdateLocationPrivacyPolicyRequestDto,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
  ): never {
    void body;
    void idempotencyKey;
    return this.capabilities.deny(principal);
  }
}

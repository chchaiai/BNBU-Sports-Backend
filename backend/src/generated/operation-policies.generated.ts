/* eslint-disable */
// Generated from docs/backend-contracts/openapi.yaml. Do not edit.

export const operationPolicies = {
  "getHealthLive": {
    "method": "GET",
    "route": "/health/live",
    "policyId": "PUBLIC-HEALTH-LIVE",
    "authentication": "PUBLIC",
    "allowedRoles": [],
    "organizationScope": "NONE",
    "resourceScope": "NONE",
    "resourceResolver": "NONE",
    "defaultDeny": true
  },
  "getHealthReady": {
    "method": "GET",
    "route": "/health/ready",
    "policyId": "PUBLIC-HEALTH-READY",
    "authentication": "PUBLIC",
    "allowedRoles": [],
    "organizationScope": "NONE",
    "resourceScope": "NONE",
    "resourceResolver": "NONE",
    "defaultDeny": true
  },
  "getSystemMode": {
    "method": "GET",
    "route": "/system-mode",
    "policyId": "PUBLIC-SYSTEM-MODE-READ",
    "authentication": "PUBLIC",
    "allowedRoles": [],
    "organizationScope": "NONE",
    "resourceScope": "NONE",
    "resourceResolver": "NONE",
    "defaultDeny": true
  },
  "getCurrentOrganization": {
    "method": "GET",
    "route": "/organizations/current",
    "policyId": "ORGANIZATION-CURRENT-READ",
    "authentication": "ACCESS_TOKEN",
    "allowedRoles": [
      "STUDENT",
      "TEACHER",
      "ADMIN"
    ],
    "organizationScope": "PRINCIPAL_ORGANIZATION",
    "resourceScope": "ORGANIZATION",
    "resourceResolver": "PRINCIPAL_ORGANIZATION",
    "defaultDeny": true
  },
  "getCurrentSemester": {
    "method": "GET",
    "route": "/semesters/current",
    "policyId": "SEMESTER-READ",
    "authentication": "ACCESS_TOKEN",
    "allowedRoles": [
      "STUDENT",
      "TEACHER",
      "ADMIN"
    ],
    "organizationScope": "PRINCIPAL_ORGANIZATION",
    "resourceScope": "ORGANIZATION",
    "resourceResolver": "PRINCIPAL_ORGANIZATION",
    "defaultDeny": true
  },
  "passwordLogin": {
    "method": "POST",
    "route": "/auth/password-login",
    "policyId": "AUTH-PASSWORD-LOGIN",
    "authentication": "PUBLIC",
    "allowedRoles": [],
    "organizationScope": "NONE",
    "resourceScope": "NONE",
    "resourceResolver": "NONE",
    "defaultDeny": true
  },
  "refreshSession": {
    "method": "POST",
    "route": "/auth/refresh",
    "policyId": "AUTH-REFRESH",
    "authentication": "PUBLIC",
    "allowedRoles": [],
    "organizationScope": "NONE",
    "resourceScope": "SESSION",
    "resourceResolver": "REFRESH_TOKEN",
    "defaultDeny": true
  },
  "logoutSession": {
    "method": "POST",
    "route": "/auth/logout",
    "policyId": "AUTH-LOGOUT",
    "authentication": "ACCESS_TOKEN",
    "allowedRoles": [
      "STUDENT",
      "TEACHER",
      "ADMIN"
    ],
    "organizationScope": "PRINCIPAL_ORGANIZATION",
    "resourceScope": "SESSION",
    "resourceResolver": "AUTHENTICATED_SESSION",
    "defaultDeny": true
  },
  "getCurrentUser": {
    "method": "GET",
    "route": "/me",
    "policyId": "USER-SELF-READ",
    "authentication": "ACCESS_TOKEN",
    "allowedRoles": [
      "STUDENT",
      "TEACHER",
      "ADMIN"
    ],
    "organizationScope": "PRINCIPAL_ORGANIZATION",
    "resourceScope": "SELF",
    "resourceResolver": "PRINCIPAL_USER",
    "defaultDeny": true
  },
  "updateCurrentUserProfile": {
    "method": "PATCH",
    "route": "/me",
    "policyId": "USER-SELF-UPDATE",
    "authentication": "ACCESS_TOKEN",
    "allowedRoles": [
      "STUDENT",
      "TEACHER",
      "ADMIN"
    ],
    "organizationScope": "PRINCIPAL_ORGANIZATION",
    "resourceScope": "SELF",
    "resourceResolver": "PRINCIPAL_USER",
    "defaultDeny": true
  },
  "listStudents": {
    "method": "GET",
    "route": "/students",
    "policyId": "STUDENT-LIST",
    "authentication": "ACCESS_TOKEN",
    "allowedRoles": [
      "TEACHER",
      "ADMIN"
    ],
    "organizationScope": "PRINCIPAL_ORGANIZATION",
    "resourceScope": "ROLE_SCOPED",
    "resourceResolver": "STUDENT_LIST_SCOPE",
    "defaultDeny": true
  },
  "getStudent": {
    "method": "GET",
    "route": "/students/{studentId}",
    "policyId": "STUDENT-READ",
    "authentication": "ACCESS_TOKEN",
    "allowedRoles": [
      "STUDENT",
      "TEACHER",
      "ADMIN"
    ],
    "organizationScope": "PRINCIPAL_ORGANIZATION",
    "resourceScope": "ROLE_SCOPED",
    "resourceResolver": "STUDENT_FROM_PATH",
    "defaultDeny": true
  },
  "updateStudent": {
    "method": "PATCH",
    "route": "/students/{studentId}",
    "policyId": "STUDENT-UPDATE",
    "authentication": "ACCESS_TOKEN",
    "allowedRoles": [
      "STUDENT",
      "TEACHER",
      "ADMIN"
    ],
    "organizationScope": "PRINCIPAL_ORGANIZATION",
    "resourceScope": "ROLE_SCOPED",
    "resourceResolver": "STUDENT_FROM_PATH",
    "defaultDeny": true
  },
  "getTeacher": {
    "method": "GET",
    "route": "/teachers/{teacherId}",
    "policyId": "TEACHER-READ",
    "authentication": "ACCESS_TOKEN",
    "allowedRoles": [
      "STUDENT",
      "TEACHER",
      "ADMIN"
    ],
    "organizationScope": "PRINCIPAL_ORGANIZATION",
    "resourceScope": "ROLE_SCOPED",
    "resourceResolver": "TEACHER_FROM_PATH",
    "defaultDeny": true
  },
  "listTeacherClassSections": {
    "method": "GET",
    "route": "/teachers/{teacherId}/class-sections",
    "policyId": "TEACHER-CLASS-SECTION-LIST",
    "authentication": "ACCESS_TOKEN",
    "allowedRoles": [
      "TEACHER",
      "ADMIN"
    ],
    "organizationScope": "PRINCIPAL_ORGANIZATION",
    "resourceScope": "ROLE_SCOPED",
    "resourceResolver": "TEACHER_FROM_PATH",
    "defaultDeny": true
  },
  "listCourses": {
    "method": "GET",
    "route": "/courses",
    "policyId": "COURSE-LIST",
    "authentication": "ACCESS_TOKEN",
    "allowedRoles": [
      "STUDENT",
      "TEACHER",
      "ADMIN"
    ],
    "organizationScope": "PRINCIPAL_ORGANIZATION",
    "resourceScope": "ORGANIZATION",
    "resourceResolver": "PRINCIPAL_ORGANIZATION",
    "defaultDeny": true
  },
  "createCourse": {
    "method": "POST",
    "route": "/courses",
    "policyId": "COURSE-CREATE",
    "authentication": "ACCESS_TOKEN",
    "allowedRoles": [
      "ADMIN"
    ],
    "organizationScope": "PRINCIPAL_ORGANIZATION",
    "resourceScope": "ORGANIZATION",
    "resourceResolver": "PRINCIPAL_ORGANIZATION",
    "defaultDeny": true
  },
  "getCourse": {
    "method": "GET",
    "route": "/courses/{courseId}",
    "policyId": "COURSE-READ",
    "authentication": "ACCESS_TOKEN",
    "allowedRoles": [
      "STUDENT",
      "TEACHER",
      "ADMIN"
    ],
    "organizationScope": "PRINCIPAL_ORGANIZATION",
    "resourceScope": "ROLE_SCOPED",
    "resourceResolver": "COURSE_FROM_PATH",
    "defaultDeny": true
  },
  "updateCourse": {
    "method": "PATCH",
    "route": "/courses/{courseId}",
    "policyId": "COURSE-UPDATE",
    "authentication": "ACCESS_TOKEN",
    "allowedRoles": [
      "ADMIN"
    ],
    "organizationScope": "PRINCIPAL_ORGANIZATION",
    "resourceScope": "ROLE_SCOPED",
    "resourceResolver": "COURSE_FROM_PATH",
    "defaultDeny": true
  },
  "listClassSections": {
    "method": "GET",
    "route": "/class-sections",
    "policyId": "CLASS-SECTION-LIST",
    "authentication": "ACCESS_TOKEN",
    "allowedRoles": [
      "STUDENT",
      "TEACHER",
      "ADMIN"
    ],
    "organizationScope": "PRINCIPAL_ORGANIZATION",
    "resourceScope": "ROLE_SCOPED",
    "resourceResolver": "CLASS_SECTION_LIST_SCOPE",
    "defaultDeny": true
  },
  "createClassSection": {
    "method": "POST",
    "route": "/class-sections",
    "policyId": "CLASS-SECTION-CREATE",
    "authentication": "ACCESS_TOKEN",
    "allowedRoles": [
      "TEACHER"
    ],
    "organizationScope": "PRINCIPAL_ORGANIZATION",
    "resourceScope": "TEACHER_CLASS_SECTION",
    "resourceResolver": "CLASS_SECTION_FROM_REQUEST",
    "defaultDeny": true
  },
  "getClassSection": {
    "method": "GET",
    "route": "/class-sections/{classSectionId}",
    "policyId": "CLASS-SECTION-READ",
    "authentication": "ACCESS_TOKEN",
    "allowedRoles": [
      "STUDENT",
      "TEACHER",
      "ADMIN"
    ],
    "organizationScope": "PRINCIPAL_ORGANIZATION",
    "resourceScope": "ROLE_SCOPED",
    "resourceResolver": "CLASS_SECTION_FROM_PATH",
    "defaultDeny": true
  },
  "updateClassSection": {
    "method": "PATCH",
    "route": "/class-sections/{classSectionId}",
    "policyId": "CLASS-SECTION-UPDATE",
    "authentication": "ACCESS_TOKEN",
    "allowedRoles": [
      "TEACHER"
    ],
    "organizationScope": "PRINCIPAL_ORGANIZATION",
    "resourceScope": "TEACHER_CLASS_SECTION",
    "resourceResolver": "CLASS_SECTION_FROM_PATH",
    "defaultDeny": true
  },
  "closeClassSection": {
    "method": "POST",
    "route": "/class-sections/{classSectionId}/close",
    "policyId": "CLASS-SECTION-CLOSE",
    "authentication": "ACCESS_TOKEN",
    "allowedRoles": [
      "TEACHER"
    ],
    "organizationScope": "PRINCIPAL_ORGANIZATION",
    "resourceScope": "TEACHER_CLASS_SECTION",
    "resourceResolver": "CLASS_SECTION_FROM_PATH",
    "defaultDeny": true
  },
  "listEnrollments": {
    "method": "GET",
    "route": "/enrollments",
    "policyId": "ENROLLMENT-LIST",
    "authentication": "ACCESS_TOKEN",
    "allowedRoles": [
      "STUDENT",
      "TEACHER",
      "ADMIN"
    ],
    "organizationScope": "PRINCIPAL_ORGANIZATION",
    "resourceScope": "ROLE_SCOPED",
    "resourceResolver": "ENROLLMENT_LIST_SCOPE",
    "defaultDeny": true
  },
  "manuallyEnrollStudent": {
    "method": "POST",
    "route": "/class-sections/{classSectionId}/enrollments",
    "policyId": "ENROLLMENT-MANUAL-ADD",
    "authentication": "ACCESS_TOKEN",
    "allowedRoles": [
      "TEACHER"
    ],
    "organizationScope": "PRINCIPAL_ORGANIZATION",
    "resourceScope": "TEACHER_CLASS_SECTION",
    "resourceResolver": "CLASS_SECTION_FROM_PATH",
    "defaultDeny": true
  },
  "getEnrollment": {
    "method": "GET",
    "route": "/enrollments/{enrollmentId}",
    "policyId": "ENROLLMENT-READ",
    "authentication": "ACCESS_TOKEN",
    "allowedRoles": [
      "STUDENT",
      "TEACHER",
      "ADMIN"
    ],
    "organizationScope": "PRINCIPAL_ORGANIZATION",
    "resourceScope": "ROLE_SCOPED",
    "resourceResolver": "ENROLLMENT_FROM_PATH",
    "defaultDeny": true
  },
  "withdrawEnrollment": {
    "method": "POST",
    "route": "/enrollments/{enrollmentId}/withdraw",
    "policyId": "ENROLLMENT-WITHDRAW",
    "authentication": "ACCESS_TOKEN",
    "allowedRoles": [
      "STUDENT"
    ],
    "organizationScope": "PRINCIPAL_ORGANIZATION",
    "resourceScope": "SELF",
    "resourceResolver": "ENROLLMENT_FROM_PATH",
    "defaultDeny": true
  },
  "removeEnrollment": {
    "method": "POST",
    "route": "/enrollments/{enrollmentId}/remove",
    "policyId": "ENROLLMENT-REMOVE",
    "authentication": "ACCESS_TOKEN",
    "allowedRoles": [
      "TEACHER"
    ],
    "organizationScope": "PRINCIPAL_ORGANIZATION",
    "resourceScope": "TEACHER_CLASS_SECTION",
    "resourceResolver": "ENROLLMENT_FROM_PATH",
    "defaultDeny": true
  },
  "restoreEnrollment": {
    "method": "POST",
    "route": "/enrollments/{enrollmentId}/restore",
    "policyId": "ENROLLMENT-RESTORE",
    "authentication": "ACCESS_TOKEN",
    "allowedRoles": [
      "TEACHER"
    ],
    "organizationScope": "PRINCIPAL_ORGANIZATION",
    "resourceScope": "TEACHER_CLASS_SECTION",
    "resourceResolver": "ENROLLMENT_FROM_PATH",
    "defaultDeny": true
  },
  "createCourseInvite": {
    "method": "POST",
    "route": "/class-sections/{classSectionId}/course-invites",
    "policyId": "COURSE-INVITE-CREATE",
    "authentication": "ACCESS_TOKEN",
    "allowedRoles": [
      "TEACHER"
    ],
    "organizationScope": "PRINCIPAL_ORGANIZATION",
    "resourceScope": "TEACHER_CLASS_SECTION",
    "resourceResolver": "CLASS_SECTION_FROM_PATH",
    "defaultDeny": true
  },
  "previewCourseInvite": {
    "method": "GET",
    "route": "/course-invites/{inviteToken}/preview",
    "policyId": "PUBLIC-COURSE-INVITE-PREVIEW",
    "authentication": "PUBLIC",
    "allowedRoles": [],
    "organizationScope": "NONE",
    "resourceScope": "PUBLIC_INVITE",
    "resourceResolver": "COURSE_INVITE_FROM_PATH",
    "defaultDeny": true
  },
  "issueJoinCapability": {
    "method": "POST",
    "route": "/course-invites/{inviteToken}/join-capabilities",
    "policyId": "PUBLIC-JOIN-CAPABILITY-ISSUE",
    "authentication": "PUBLIC",
    "allowedRoles": [],
    "organizationScope": "NONE",
    "resourceScope": "PUBLIC_INVITE",
    "resourceResolver": "COURSE_INVITE_FROM_PATH",
    "defaultDeny": true
  },
  "joinClassSectionWithInvite": {
    "method": "POST",
    "route": "/course-invites/{inviteToken}/join",
    "policyId": "ENROLLMENT-JOIN",
    "authentication": "JOIN_CAPABILITY",
    "allowedRoles": [],
    "organizationScope": "CAPABILITY_ORGANIZATION",
    "resourceScope": "CAPABILITY_CLASS_SECTION",
    "resourceResolver": "JOIN_CAPABILITY",
    "defaultDeny": true
  },
  "listRosterImports": {
    "method": "GET",
    "route": "/class-sections/{classSectionId}/roster-imports",
    "policyId": "ROSTER-IMPORT-LIST",
    "authentication": "ACCESS_TOKEN",
    "allowedRoles": [
      "TEACHER",
      "ADMIN"
    ],
    "organizationScope": "PRINCIPAL_ORGANIZATION",
    "resourceScope": "ROLE_SCOPED",
    "resourceResolver": "ROSTER_CLASS_SECTION_READ_SCOPE",
    "defaultDeny": true
  },
  "createRosterImport": {
    "method": "POST",
    "route": "/class-sections/{classSectionId}/roster-imports",
    "policyId": "ROSTER-IMPORT-CREATE",
    "authentication": "ACCESS_TOKEN",
    "allowedRoles": [
      "TEACHER"
    ],
    "organizationScope": "PRINCIPAL_ORGANIZATION",
    "resourceScope": "TEACHER_CLASS_SECTION",
    "resourceResolver": "CLASS_SECTION_FROM_PATH",
    "defaultDeny": true
  },
  "getCurrentRosterImport": {
    "method": "GET",
    "route": "/class-sections/{classSectionId}/roster-imports/current",
    "policyId": "ROSTER-IMPORT-CURRENT-READ",
    "authentication": "ACCESS_TOKEN",
    "allowedRoles": [
      "TEACHER",
      "ADMIN"
    ],
    "organizationScope": "PRINCIPAL_ORGANIZATION",
    "resourceScope": "ROLE_SCOPED",
    "resourceResolver": "ROSTER_CLASS_SECTION_READ_SCOPE",
    "defaultDeny": true
  },
  "getRosterImport": {
    "method": "GET",
    "route": "/roster-imports/{rosterImportId}",
    "policyId": "ROSTER-IMPORT-READ",
    "authentication": "ACCESS_TOKEN",
    "allowedRoles": [
      "TEACHER",
      "ADMIN"
    ],
    "organizationScope": "PRINCIPAL_ORGANIZATION",
    "resourceScope": "ROLE_SCOPED",
    "resourceResolver": "ROSTER_IMPORT_READ_SCOPE",
    "defaultDeny": true
  },
  "rollbackRosterImport": {
    "method": "POST",
    "route": "/roster-imports/{rosterImportId}/rollback",
    "policyId": "ROSTER-IMPORT-ROLLBACK",
    "authentication": "ACCESS_TOKEN",
    "allowedRoles": [
      "TEACHER"
    ],
    "organizationScope": "PRINCIPAL_ORGANIZATION",
    "resourceScope": "TEACHER_CLASS_SECTION",
    "resourceResolver": "ROSTER_IMPORT_FROM_PATH",
    "defaultDeny": true
  },
  "listRosterEntries": {
    "method": "GET",
    "route": "/roster-imports/{rosterImportId}/entries",
    "policyId": "ROSTER-ENTRY-LIST",
    "authentication": "ACCESS_TOKEN",
    "allowedRoles": [
      "TEACHER",
      "ADMIN"
    ],
    "organizationScope": "PRINCIPAL_ORGANIZATION",
    "resourceScope": "ROLE_SCOPED",
    "resourceResolver": "ROSTER_IMPORT_READ_SCOPE",
    "defaultDeny": true
  },
  "alignRosterImport": {
    "method": "POST",
    "route": "/roster-imports/{rosterImportId}/align",
    "policyId": "ROSTER-IMPORT-ALIGN",
    "authentication": "ACCESS_TOKEN",
    "allowedRoles": [
      "TEACHER"
    ],
    "organizationScope": "PRINCIPAL_ORGANIZATION",
    "resourceScope": "TEACHER_CLASS_SECTION",
    "resourceResolver": "ROSTER_IMPORT_FROM_PATH",
    "defaultDeny": true
  },
  "listRosterAlignmentResults": {
    "method": "GET",
    "route": "/roster-alignment-results",
    "policyId": "ROSTER-ALIGNMENT-LIST",
    "authentication": "ACCESS_TOKEN",
    "allowedRoles": [
      "TEACHER",
      "ADMIN"
    ],
    "organizationScope": "PRINCIPAL_ORGANIZATION",
    "resourceScope": "ROLE_SCOPED",
    "resourceResolver": "ROSTER_ALIGNMENT_LIST_SCOPE",
    "defaultDeny": true
  },
  "getRosterAlignmentResult": {
    "method": "GET",
    "route": "/roster-alignment-results/{alignmentResultId}",
    "policyId": "ROSTER-ALIGNMENT-READ",
    "authentication": "ACCESS_TOKEN",
    "allowedRoles": [
      "TEACHER",
      "ADMIN"
    ],
    "organizationScope": "PRINCIPAL_ORGANIZATION",
    "resourceScope": "ROLE_SCOPED",
    "resourceResolver": "ROSTER_ALIGNMENT_READ_SCOPE",
    "defaultDeny": true
  },
  "confirmRosterAlignmentResult": {
    "method": "POST",
    "route": "/roster-alignment-results/{alignmentResultId}/confirm",
    "policyId": "ROSTER-ALIGNMENT-CONFIRM",
    "authentication": "ACCESS_TOKEN",
    "allowedRoles": [
      "TEACHER"
    ],
    "organizationScope": "PRINCIPAL_ORGANIZATION",
    "resourceScope": "TEACHER_CLASS_SECTION",
    "resourceResolver": "ROSTER_ALIGNMENT_FROM_PATH",
    "defaultDeny": true
  },
  "resolveRosterAlignmentResult": {
    "method": "POST",
    "route": "/roster-alignment-results/{alignmentResultId}/resolve",
    "policyId": "ROSTER-ALIGNMENT-RESOLVE",
    "authentication": "ACCESS_TOKEN",
    "allowedRoles": [
      "TEACHER"
    ],
    "organizationScope": "PRINCIPAL_ORGANIZATION",
    "resourceScope": "TEACHER_CLASS_SECTION",
    "resourceResolver": "ROSTER_ALIGNMENT_FROM_PATH",
    "defaultDeny": true
  },
  "ignoreRosterAlignmentResult": {
    "method": "POST",
    "route": "/roster-alignment-results/{alignmentResultId}/ignore",
    "policyId": "ROSTER-ALIGNMENT-IGNORE",
    "authentication": "ACCESS_TOKEN",
    "allowedRoles": [
      "TEACHER"
    ],
    "organizationScope": "PRINCIPAL_ORGANIZATION",
    "resourceScope": "TEACHER_CLASS_SECTION",
    "resourceResolver": "ROSTER_ALIGNMENT_FROM_PATH",
    "defaultDeny": true
  },
  "reopenRosterAlignmentResult": {
    "method": "POST",
    "route": "/roster-alignment-results/{alignmentResultId}/reopen",
    "policyId": "ROSTER-ALIGNMENT-REOPEN",
    "authentication": "ACCESS_TOKEN",
    "allowedRoles": [
      "TEACHER"
    ],
    "organizationScope": "PRINCIPAL_ORGANIZATION",
    "resourceScope": "TEACHER_CLASS_SECTION",
    "resourceResolver": "ROSTER_ALIGNMENT_FROM_PATH",
    "defaultDeny": true
  },
  "startExerciseSession": {
    "method": "POST",
    "route": "/exercise-sessions",
    "policyId": "EXERCISE-SESSION-START",
    "authentication": "ACCESS_TOKEN",
    "allowedRoles": [
      "STUDENT"
    ],
    "organizationScope": "PRINCIPAL_ORGANIZATION",
    "resourceScope": "SELF",
    "resourceResolver": "ENROLLMENT_FROM_REQUEST",
    "defaultDeny": true
  },
  "getActiveExerciseSession": {
    "method": "GET",
    "route": "/exercise-sessions/active",
    "policyId": "EXERCISE-SESSION-ACTIVE-READ",
    "authentication": "ACCESS_TOKEN",
    "allowedRoles": [
      "STUDENT"
    ],
    "organizationScope": "PRINCIPAL_ORGANIZATION",
    "resourceScope": "SELF",
    "resourceResolver": "PRINCIPAL_STUDENT",
    "defaultDeny": true
  },
  "getExerciseSession": {
    "method": "GET",
    "route": "/exercise-sessions/{sessionId}",
    "policyId": "EXERCISE-SESSION-READ",
    "authentication": "ACCESS_TOKEN",
    "allowedRoles": [
      "STUDENT"
    ],
    "organizationScope": "PRINCIPAL_ORGANIZATION",
    "resourceScope": "SELF",
    "resourceResolver": "EXERCISE_SESSION_FROM_PATH",
    "defaultDeny": true
  },
  "pauseExerciseSession": {
    "method": "POST",
    "route": "/exercise-sessions/{sessionId}/pause",
    "policyId": "EXERCISE-SESSION-PAUSE",
    "authentication": "ACCESS_TOKEN",
    "allowedRoles": [
      "STUDENT"
    ],
    "organizationScope": "PRINCIPAL_ORGANIZATION",
    "resourceScope": "SELF",
    "resourceResolver": "EXERCISE_SESSION_FROM_PATH",
    "defaultDeny": true
  },
  "resumeExerciseSession": {
    "method": "POST",
    "route": "/exercise-sessions/{sessionId}/resume",
    "policyId": "EXERCISE-SESSION-RESUME",
    "authentication": "ACCESS_TOKEN",
    "allowedRoles": [
      "STUDENT"
    ],
    "organizationScope": "PRINCIPAL_ORGANIZATION",
    "resourceScope": "SELF",
    "resourceResolver": "EXERCISE_SESSION_FROM_PATH",
    "defaultDeny": true
  },
  "finishExerciseSession": {
    "method": "POST",
    "route": "/exercise-sessions/{sessionId}/finish",
    "policyId": "EXERCISE-SESSION-FINISH",
    "authentication": "ACCESS_TOKEN",
    "allowedRoles": [
      "STUDENT"
    ],
    "organizationScope": "PRINCIPAL_ORGANIZATION",
    "resourceScope": "SELF",
    "resourceResolver": "EXERCISE_SESSION_FROM_PATH",
    "defaultDeny": true
  },
  "cancelExerciseSession": {
    "method": "POST",
    "route": "/exercise-sessions/{sessionId}/cancel",
    "policyId": "EXERCISE-SESSION-CANCEL",
    "authentication": "ACCESS_TOKEN",
    "allowedRoles": [
      "STUDENT"
    ],
    "organizationScope": "PRINCIPAL_ORGANIZATION",
    "resourceScope": "SELF",
    "resourceResolver": "EXERCISE_SESSION_FROM_PATH",
    "defaultDeny": true
  },
  "reconcileExerciseSession": {
    "method": "POST",
    "route": "/exercise-sessions/{sessionId}/reconcile",
    "policyId": "EXERCISE-SESSION-RECONCILE",
    "authentication": "ACCESS_TOKEN",
    "allowedRoles": [
      "STUDENT"
    ],
    "organizationScope": "PRINCIPAL_ORGANIZATION",
    "resourceScope": "SELF",
    "resourceResolver": "EXERCISE_SESSION_FROM_PATH",
    "defaultDeny": true
  },
  "listExerciseRecords": {
    "method": "GET",
    "route": "/exercise-records",
    "policyId": "EXERCISE-RECORD-LIST",
    "authentication": "ACCESS_TOKEN",
    "allowedRoles": [
      "STUDENT",
      "TEACHER",
      "ADMIN"
    ],
    "organizationScope": "PRINCIPAL_ORGANIZATION",
    "resourceScope": "ROLE_SCOPED",
    "resourceResolver": "EXERCISE_RECORD_LIST_SCOPE",
    "defaultDeny": true
  },
  "createExerciseRecordDraft": {
    "method": "POST",
    "route": "/exercise-records",
    "policyId": "EXERCISE-RECORD-CREATE",
    "authentication": "ACCESS_TOKEN",
    "allowedRoles": [
      "STUDENT"
    ],
    "organizationScope": "PRINCIPAL_ORGANIZATION",
    "resourceScope": "SELF",
    "resourceResolver": "EXERCISE_SESSION_FROM_REQUEST",
    "defaultDeny": true
  },
  "getExerciseRecord": {
    "method": "GET",
    "route": "/exercise-records/{recordId}",
    "policyId": "EXERCISE-RECORD-READ",
    "authentication": "ACCESS_TOKEN",
    "allowedRoles": [
      "STUDENT",
      "TEACHER",
      "ADMIN"
    ],
    "organizationScope": "PRINCIPAL_ORGANIZATION",
    "resourceScope": "ROLE_SCOPED",
    "resourceResolver": "EXERCISE_RECORD_FROM_PATH",
    "defaultDeny": true
  },
  "updateExerciseRecordDraft": {
    "method": "PATCH",
    "route": "/exercise-records/{recordId}",
    "policyId": "EXERCISE-RECORD-UPDATE",
    "authentication": "ACCESS_TOKEN",
    "allowedRoles": [
      "STUDENT"
    ],
    "organizationScope": "PRINCIPAL_ORGANIZATION",
    "resourceScope": "SELF",
    "resourceResolver": "EXERCISE_RECORD_FROM_PATH",
    "defaultDeny": true
  },
  "submitExerciseRecord": {
    "method": "POST",
    "route": "/exercise-records/{recordId}/submit",
    "policyId": "EXERCISE-RECORD-SUBMIT",
    "authentication": "ACCESS_TOKEN",
    "allowedRoles": [
      "STUDENT"
    ],
    "organizationScope": "PRINCIPAL_ORGANIZATION",
    "resourceScope": "SELF",
    "resourceResolver": "EXERCISE_RECORD_FROM_PATH",
    "defaultDeny": true
  },
  "discardExerciseRecord": {
    "method": "POST",
    "route": "/exercise-records/{recordId}/discard",
    "policyId": "EXERCISE-RECORD-DISCARD",
    "authentication": "ACCESS_TOKEN",
    "allowedRoles": [
      "STUDENT"
    ],
    "organizationScope": "PRINCIPAL_ORGANIZATION",
    "resourceScope": "SELF",
    "resourceResolver": "EXERCISE_RECORD_FROM_PATH",
    "defaultDeny": true
  },
  "withdrawExerciseRecord": {
    "method": "POST",
    "route": "/exercise-records/{recordId}/withdraw",
    "policyId": "EXERCISE-RECORD-WITHDRAW",
    "authentication": "ACCESS_TOKEN",
    "allowedRoles": [
      "STUDENT"
    ],
    "organizationScope": "PRINCIPAL_ORGANIZATION",
    "resourceScope": "SELF",
    "resourceResolver": "EXERCISE_RECORD_FROM_PATH",
    "defaultDeny": true
  },
  "initiateMediaUpload": {
    "method": "POST",
    "route": "/media-uploads",
    "policyId": "MEDIA-UPLOAD-INITIATE",
    "authentication": "ACCESS_TOKEN",
    "allowedRoles": [
      "STUDENT"
    ],
    "organizationScope": "PRINCIPAL_ORGANIZATION",
    "resourceScope": "SELF",
    "resourceResolver": "EXERCISE_SESSION_FROM_REQUEST",
    "defaultDeny": true
  },
  "confirmMediaUpload": {
    "method": "POST",
    "route": "/media-uploads/{uploadSessionId}/confirm",
    "policyId": "MEDIA-UPLOAD-CONFIRM",
    "authentication": "ACCESS_TOKEN",
    "allowedRoles": [
      "STUDENT"
    ],
    "organizationScope": "PRINCIPAL_ORGANIZATION",
    "resourceScope": "SELF",
    "resourceResolver": "MEDIA_UPLOAD_FROM_PATH",
    "defaultDeny": true
  },
  "getMediaEvidence": {
    "method": "GET",
    "route": "/media/{mediaId}",
    "policyId": "MEDIA-READ",
    "authentication": "ACCESS_TOKEN",
    "allowedRoles": [
      "STUDENT",
      "TEACHER"
    ],
    "organizationScope": "PRINCIPAL_ORGANIZATION",
    "resourceScope": "ROLE_SCOPED",
    "resourceResolver": "MEDIA_FROM_PATH",
    "defaultDeny": true
  },
  "bindMediaEvidence": {
    "method": "POST",
    "route": "/media/{mediaId}/bind",
    "policyId": "MEDIA-BIND",
    "authentication": "ACCESS_TOKEN",
    "allowedRoles": [
      "STUDENT"
    ],
    "organizationScope": "PRINCIPAL_ORGANIZATION",
    "resourceScope": "SELF",
    "resourceResolver": "MEDIA_FROM_PATH",
    "defaultDeny": true
  },
  "createMediaAccessUrl": {
    "method": "POST",
    "route": "/media/{mediaId}/access-url",
    "policyId": "MEDIA-ACCESS-URL",
    "authentication": "ACCESS_TOKEN",
    "allowedRoles": [
      "STUDENT",
      "TEACHER"
    ],
    "organizationScope": "PRINCIPAL_ORGANIZATION",
    "resourceScope": "ROLE_SCOPED",
    "resourceResolver": "MEDIA_FROM_PATH",
    "defaultDeny": true
  },
  "listExerciseRecordReviews": {
    "method": "GET",
    "route": "/exercise-records/{recordId}/reviews",
    "policyId": "EXERCISE-REVIEW-LIST",
    "authentication": "ACCESS_TOKEN",
    "allowedRoles": [
      "TEACHER"
    ],
    "organizationScope": "PRINCIPAL_ORGANIZATION",
    "resourceScope": "TEACHER_CLASS_SECTION",
    "resourceResolver": "EXERCISE_RECORD_FROM_PATH",
    "defaultDeny": true
  },
  "reviewExerciseRecord": {
    "method": "POST",
    "route": "/exercise-records/{recordId}/reviews",
    "policyId": "EXERCISE-REVIEW-CREATE",
    "authentication": "ACCESS_TOKEN",
    "allowedRoles": [
      "TEACHER"
    ],
    "organizationScope": "PRINCIPAL_ORGANIZATION",
    "resourceScope": "TEACHER_CLASS_SECTION",
    "resourceResolver": "EXERCISE_RECORD_FROM_PATH",
    "defaultDeny": true
  },
  "reopenExerciseRecordReview": {
    "method": "POST",
    "route": "/exercise-records/{recordId}/reviews/reopen",
    "policyId": "EXERCISE-REVIEW-REOPEN",
    "authentication": "ACCESS_TOKEN",
    "allowedRoles": [
      "TEACHER"
    ],
    "organizationScope": "PRINCIPAL_ORGANIZATION",
    "resourceScope": "TEACHER_CLASS_SECTION",
    "resourceResolver": "EXERCISE_RECORD_FROM_PATH",
    "defaultDeny": true
  },
  "batchReviewExerciseRecords": {
    "method": "POST",
    "route": "/exercise-reviews/batch",
    "policyId": "EXERCISE-REVIEW-BATCH",
    "authentication": "ACCESS_TOKEN",
    "allowedRoles": [
      "TEACHER"
    ],
    "organizationScope": "PRINCIPAL_ORGANIZATION",
    "resourceScope": "TEACHER_CLASS_SECTION",
    "resourceResolver": "BATCH_EXERCISE_RECORDS_FROM_BODY",
    "defaultDeny": true
  },
  "listScoreRules": {
    "method": "GET",
    "route": "/class-sections/{classSectionId}/score-rules",
    "policyId": "SCORE-RULE-LIST",
    "authentication": "ACCESS_TOKEN",
    "allowedRoles": [
      "TEACHER",
      "ADMIN"
    ],
    "organizationScope": "PRINCIPAL_ORGANIZATION",
    "resourceScope": "ROLE_SCOPED",
    "resourceResolver": "CLASS_SECTION_FROM_PATH",
    "defaultDeny": true
  },
  "createScoreRule": {
    "method": "POST",
    "route": "/class-sections/{classSectionId}/score-rules",
    "policyId": "SCORE-RULE-CREATE",
    "authentication": "ACCESS_TOKEN",
    "allowedRoles": [
      "ADMIN"
    ],
    "organizationScope": "PRINCIPAL_ORGANIZATION",
    "resourceScope": "ORGANIZATION",
    "resourceResolver": "PRINCIPAL_ORGANIZATION",
    "defaultDeny": true
  },
  "getScoreRule": {
    "method": "GET",
    "route": "/score-rules/{scoreRuleId}",
    "policyId": "SCORE-RULE-READ",
    "authentication": "ACCESS_TOKEN",
    "allowedRoles": [
      "TEACHER",
      "ADMIN"
    ],
    "organizationScope": "PRINCIPAL_ORGANIZATION",
    "resourceScope": "ROLE_SCOPED",
    "resourceResolver": "SCORE_RULE_FROM_PATH",
    "defaultDeny": true
  },
  "submitScoreRuleForApproval": {
    "method": "POST",
    "route": "/score-rules/{scoreRuleId}/submit-approval",
    "policyId": "SCORE-RULE-SUBMIT-APPROVAL",
    "authentication": "ACCESS_TOKEN",
    "allowedRoles": [
      "ADMIN"
    ],
    "organizationScope": "PRINCIPAL_ORGANIZATION",
    "resourceScope": "ORGANIZATION",
    "resourceResolver": "SCORE_RULE_FROM_PATH",
    "defaultDeny": true
  },
  "approveScoreRule": {
    "method": "POST",
    "route": "/score-rules/{scoreRuleId}/approve",
    "policyId": "SCORE-RULE-APPROVE",
    "authentication": "ACCESS_TOKEN",
    "allowedRoles": [
      "ADMIN"
    ],
    "organizationScope": "PRINCIPAL_ORGANIZATION",
    "resourceScope": "ORGANIZATION",
    "resourceResolver": "SCORE_RULE_FROM_PATH",
    "defaultDeny": true
  },
  "rejectScoreRule": {
    "method": "POST",
    "route": "/score-rules/{scoreRuleId}/reject",
    "policyId": "SCORE-RULE-REJECT",
    "authentication": "ACCESS_TOKEN",
    "allowedRoles": [
      "ADMIN"
    ],
    "organizationScope": "PRINCIPAL_ORGANIZATION",
    "resourceScope": "ORGANIZATION",
    "resourceResolver": "SCORE_RULE_FROM_PATH",
    "defaultDeny": true
  },
  "listStudentScores": {
    "method": "GET",
    "route": "/student-scores",
    "policyId": "STUDENT-SCORE-LIST",
    "authentication": "ACCESS_TOKEN",
    "allowedRoles": [
      "STUDENT",
      "TEACHER",
      "ADMIN"
    ],
    "organizationScope": "PRINCIPAL_ORGANIZATION",
    "resourceScope": "ROLE_SCOPED",
    "resourceResolver": "STUDENT_SCORE_LIST_SCOPE",
    "defaultDeny": true
  },
  "getStudentScore": {
    "method": "GET",
    "route": "/student-scores/{studentScoreId}",
    "policyId": "STUDENT-SCORE-READ",
    "authentication": "ACCESS_TOKEN",
    "allowedRoles": [
      "STUDENT",
      "TEACHER",
      "ADMIN"
    ],
    "organizationScope": "PRINCIPAL_ORGANIZATION",
    "resourceScope": "ROLE_SCOPED",
    "resourceResolver": "STUDENT_SCORE_FROM_PATH",
    "defaultDeny": true
  },
  "recalculateStudentScore": {
    "method": "POST",
    "route": "/student-scores/{studentScoreId}/recalculate",
    "policyId": "STUDENT-SCORE-RECALCULATE",
    "authentication": "ACCESS_TOKEN",
    "allowedRoles": [
      "TEACHER"
    ],
    "organizationScope": "PRINCIPAL_ORGANIZATION",
    "resourceScope": "TEACHER_CLASS_SECTION",
    "resourceResolver": "STUDENT_SCORE_FROM_PATH",
    "defaultDeny": true
  },
  "publishStudentScore": {
    "method": "POST",
    "route": "/student-scores/{studentScoreId}/publish",
    "policyId": "STUDENT-SCORE-PUBLISH",
    "authentication": "ACCESS_TOKEN",
    "allowedRoles": [
      "TEACHER"
    ],
    "organizationScope": "PRINCIPAL_ORGANIZATION",
    "resourceScope": "TEACHER_CLASS_SECTION",
    "resourceResolver": "STUDENT_SCORE_FROM_PATH",
    "defaultDeny": true
  },
  "openStudentScoreCorrection": {
    "method": "POST",
    "route": "/student-scores/{studentScoreId}/open-correction",
    "policyId": "STUDENT-SCORE-OPEN-CORRECTION",
    "authentication": "ACCESS_TOKEN",
    "allowedRoles": [
      "TEACHER"
    ],
    "organizationScope": "PRINCIPAL_ORGANIZATION",
    "resourceScope": "TEACHER_CLASS_SECTION",
    "resourceResolver": "STUDENT_SCORE_FROM_PATH",
    "defaultDeny": true
  },
  "listScoreAdjustments": {
    "method": "GET",
    "route": "/student-scores/{studentScoreId}/adjustments",
    "policyId": "SCORE-ADJUSTMENT-LIST",
    "authentication": "ACCESS_TOKEN",
    "allowedRoles": [
      "TEACHER",
      "ADMIN"
    ],
    "organizationScope": "PRINCIPAL_ORGANIZATION",
    "resourceScope": "ROLE_SCOPED",
    "resourceResolver": "STUDENT_SCORE_FROM_PATH",
    "defaultDeny": true
  },
  "createScoreAdjustment": {
    "method": "POST",
    "route": "/student-scores/{studentScoreId}/adjustments",
    "policyId": "SCORE-ADJUSTMENT-CREATE",
    "authentication": "ACCESS_TOKEN",
    "allowedRoles": [
      "TEACHER"
    ],
    "organizationScope": "PRINCIPAL_ORGANIZATION",
    "resourceScope": "TEACHER_CLASS_SECTION",
    "resourceResolver": "STUDENT_SCORE_FROM_PATH",
    "defaultDeny": true
  },
  "approveScoreAdjustment": {
    "method": "POST",
    "route": "/score-adjustments/{scoreAdjustmentId}/approve",
    "policyId": "SCORE-ADJUSTMENT-APPROVE",
    "authentication": "ACCESS_TOKEN",
    "allowedRoles": [
      "ADMIN"
    ],
    "organizationScope": "PRINCIPAL_ORGANIZATION",
    "resourceScope": "ORGANIZATION",
    "resourceResolver": "SCORE_ADJUSTMENT_FROM_PATH",
    "defaultDeny": true
  },
  "rejectScoreAdjustment": {
    "method": "POST",
    "route": "/score-adjustments/{scoreAdjustmentId}/reject",
    "policyId": "SCORE-ADJUSTMENT-REJECT",
    "authentication": "ACCESS_TOKEN",
    "allowedRoles": [
      "ADMIN"
    ],
    "organizationScope": "PRINCIPAL_ORGANIZATION",
    "resourceScope": "ORGANIZATION",
    "resourceResolver": "SCORE_ADJUSTMENT_FROM_PATH",
    "defaultDeny": true
  },
  "listExports": {
    "method": "GET",
    "route": "/exports",
    "policyId": "EXPORT-LIST",
    "authentication": "ACCESS_TOKEN",
    "allowedRoles": [
      "TEACHER",
      "ADMIN"
    ],
    "organizationScope": "PRINCIPAL_ORGANIZATION",
    "resourceScope": "ROLE_SCOPED",
    "resourceResolver": "EXPORT_LIST_SCOPE",
    "defaultDeny": true
  },
  "createExport": {
    "method": "POST",
    "route": "/exports",
    "policyId": "EXPORT-CREATE",
    "authentication": "ACCESS_TOKEN",
    "allowedRoles": [
      "TEACHER",
      "ADMIN"
    ],
    "organizationScope": "PRINCIPAL_ORGANIZATION",
    "resourceScope": "ROLE_SCOPED",
    "resourceResolver": "EXPORT_SCOPE_FROM_BODY",
    "defaultDeny": true
  },
  "getExport": {
    "method": "GET",
    "route": "/exports/{exportId}",
    "policyId": "EXPORT-READ",
    "authentication": "ACCESS_TOKEN",
    "allowedRoles": [
      "TEACHER",
      "ADMIN"
    ],
    "organizationScope": "PRINCIPAL_ORGANIZATION",
    "resourceScope": "ROLE_SCOPED",
    "resourceResolver": "EXPORT_FROM_PATH",
    "defaultDeny": true
  },
  "createExportDownloadUrl": {
    "method": "POST",
    "route": "/exports/{exportId}/download-url",
    "policyId": "EXPORT-DOWNLOAD-URL",
    "authentication": "ACCESS_TOKEN",
    "allowedRoles": [
      "TEACHER",
      "ADMIN"
    ],
    "organizationScope": "PRINCIPAL_ORGANIZATION",
    "resourceScope": "ROLE_SCOPED",
    "resourceResolver": "EXPORT_FROM_PATH",
    "defaultDeny": true
  },
  "listAuditLogs": {
    "method": "GET",
    "route": "/audit-logs",
    "policyId": "AUDIT-LOG-LIST",
    "authentication": "ACCESS_TOKEN",
    "allowedRoles": [
      "ADMIN"
    ],
    "organizationScope": "PRINCIPAL_ORGANIZATION",
    "resourceScope": "ORGANIZATION",
    "resourceResolver": "PRINCIPAL_ORGANIZATION",
    "defaultDeny": true
  },
  "getAuditLog": {
    "method": "GET",
    "route": "/audit-logs/{auditLogId}",
    "policyId": "AUDIT-LOG-READ",
    "authentication": "ACCESS_TOKEN",
    "allowedRoles": [
      "ADMIN"
    ],
    "organizationScope": "PRINCIPAL_ORGANIZATION",
    "resourceScope": "ORGANIZATION",
    "resourceResolver": "AUDIT_LOG_FROM_PATH",
    "defaultDeny": true
  },
  "requestStudentSignInCode": {
    "method": "POST",
    "route": "/auth/student-sign-in-codes",
    "policyId": "AUTH-STUDENT-CODE-REQUEST",
    "authentication": "PUBLIC",
    "allowedRoles": [],
    "organizationScope": "NONE",
    "resourceScope": "NONE",
    "resourceResolver": "NONE",
    "defaultDeny": true
  },
  "verifyStudentSignInCode": {
    "method": "POST",
    "route": "/auth/student-sign-in-codes/verify",
    "policyId": "AUTH-STUDENT-CODE-VERIFY",
    "authentication": "PUBLIC",
    "allowedRoles": [],
    "organizationScope": "NONE",
    "resourceScope": "NONE",
    "resourceResolver": "NONE",
    "defaultDeny": true
  },
  "requestAccountRecovery": {
    "method": "POST",
    "route": "/auth/account-recovery-requests",
    "policyId": "AUTH-ACCOUNT-RECOVERY-REQUEST",
    "authentication": "PUBLIC",
    "allowedRoles": [],
    "organizationScope": "NONE",
    "resourceScope": "NONE",
    "resourceResolver": "NONE",
    "defaultDeny": true
  },
  "completeAccountRecovery": {
    "method": "POST",
    "route": "/auth/account-recovery-requests/complete",
    "policyId": "AUTH-ACCOUNT-RECOVERY-COMPLETE",
    "authentication": "PUBLIC",
    "allowedRoles": [],
    "organizationScope": "NONE",
    "resourceScope": "NONE",
    "resourceResolver": "NONE",
    "defaultDeny": true
  },
  "listNotifications": {
    "method": "GET",
    "route": "/notifications",
    "policyId": "NOTIFICATION-LIST",
    "authentication": "ACCESS_TOKEN",
    "allowedRoles": [
      "STUDENT",
      "TEACHER",
      "ADMIN"
    ],
    "organizationScope": "PRINCIPAL_ORGANIZATION",
    "resourceScope": "SELF",
    "resourceResolver": "PRINCIPAL_USER",
    "defaultDeny": true
  },
  "markNotificationRead": {
    "method": "POST",
    "route": "/notifications/{notificationId}/read",
    "policyId": "NOTIFICATION-MARK-READ",
    "authentication": "ACCESS_TOKEN",
    "allowedRoles": [
      "STUDENT",
      "TEACHER",
      "ADMIN"
    ],
    "organizationScope": "PRINCIPAL_ORGANIZATION",
    "resourceScope": "SELF",
    "resourceResolver": "PRINCIPAL_USER",
    "defaultDeny": true
  },
  "registerPushDevice": {
    "method": "POST",
    "route": "/push-devices",
    "policyId": "PUSH-DEVICE-REGISTER",
    "authentication": "ACCESS_TOKEN",
    "allowedRoles": [
      "STUDENT",
      "TEACHER",
      "ADMIN"
    ],
    "organizationScope": "PRINCIPAL_ORGANIZATION",
    "resourceScope": "SELF",
    "resourceResolver": "PRINCIPAL_USER",
    "defaultDeny": true
  },
  "unregisterPushDevice": {
    "method": "DELETE",
    "route": "/push-devices/{deviceId}",
    "policyId": "PUSH-DEVICE-UNREGISTER",
    "authentication": "ACCESS_TOKEN",
    "allowedRoles": [
      "STUDENT",
      "TEACHER",
      "ADMIN"
    ],
    "organizationScope": "PRINCIPAL_ORGANIZATION",
    "resourceScope": "SELF",
    "resourceResolver": "PRINCIPAL_USER",
    "defaultDeny": true
  },
  "getCurrentUserPreferences": {
    "method": "GET",
    "route": "/me/preferences",
    "policyId": "USER-PREFERENCES-READ",
    "authentication": "ACCESS_TOKEN",
    "allowedRoles": [
      "STUDENT",
      "TEACHER",
      "ADMIN"
    ],
    "organizationScope": "PRINCIPAL_ORGANIZATION",
    "resourceScope": "SELF",
    "resourceResolver": "PRINCIPAL_USER",
    "defaultDeny": true
  },
  "updateCurrentUserPreferences": {
    "method": "PATCH",
    "route": "/me/preferences",
    "policyId": "USER-PREFERENCES-UPDATE",
    "authentication": "ACCESS_TOKEN",
    "allowedRoles": [
      "STUDENT",
      "TEACHER",
      "ADMIN"
    ],
    "organizationScope": "PRINCIPAL_ORGANIZATION",
    "resourceScope": "SELF",
    "resourceResolver": "PRINCIPAL_USER",
    "defaultDeny": true
  },
  "listHelpArticles": {
    "method": "GET",
    "route": "/help-articles",
    "policyId": "PUBLIC-HELP-ARTICLE-LIST",
    "authentication": "PUBLIC",
    "allowedRoles": [],
    "organizationScope": "NONE",
    "resourceScope": "NONE",
    "resourceResolver": "NONE",
    "defaultDeny": true
  },
  "getHelpArticle": {
    "method": "GET",
    "route": "/help-articles/{articleId}",
    "policyId": "PUBLIC-HELP-ARTICLE-READ",
    "authentication": "PUBLIC",
    "allowedRoles": [],
    "organizationScope": "NONE",
    "resourceScope": "NONE",
    "resourceResolver": "NONE",
    "defaultDeny": true
  },
  "listFeedback": {
    "method": "GET",
    "route": "/feedback",
    "policyId": "FEEDBACK-LIST",
    "authentication": "ACCESS_TOKEN",
    "allowedRoles": [
      "STUDENT",
      "TEACHER",
      "ADMIN"
    ],
    "organizationScope": "PRINCIPAL_ORGANIZATION",
    "resourceScope": "ROLE_SCOPED",
    "resourceResolver": "NONE",
    "defaultDeny": true
  },
  "createFeedback": {
    "method": "POST",
    "route": "/feedback",
    "policyId": "FEEDBACK-CREATE",
    "authentication": "ACCESS_TOKEN",
    "allowedRoles": [
      "STUDENT",
      "TEACHER",
      "ADMIN"
    ],
    "organizationScope": "PRINCIPAL_ORGANIZATION",
    "resourceScope": "SELF",
    "resourceResolver": "PRINCIPAL_USER",
    "defaultDeny": true
  },
  "getFeedback": {
    "method": "GET",
    "route": "/feedback/{feedbackId}",
    "policyId": "FEEDBACK-READ",
    "authentication": "ACCESS_TOKEN",
    "allowedRoles": [
      "STUDENT",
      "TEACHER",
      "ADMIN"
    ],
    "organizationScope": "PRINCIPAL_ORGANIZATION",
    "resourceScope": "ROLE_SCOPED",
    "resourceResolver": "NONE",
    "defaultDeny": true
  },
  "listExemptionApplications": {
    "method": "GET",
    "route": "/exemption-applications",
    "policyId": "EXEMPTION-APPLICATION-LIST",
    "authentication": "ACCESS_TOKEN",
    "allowedRoles": [
      "STUDENT",
      "TEACHER",
      "ADMIN"
    ],
    "organizationScope": "PRINCIPAL_ORGANIZATION",
    "resourceScope": "ROLE_SCOPED",
    "resourceResolver": "NONE",
    "defaultDeny": true
  },
  "createExemptionApplication": {
    "method": "POST",
    "route": "/exemption-applications",
    "policyId": "EXEMPTION-APPLICATION-CREATE",
    "authentication": "ACCESS_TOKEN",
    "allowedRoles": [
      "STUDENT"
    ],
    "organizationScope": "PRINCIPAL_ORGANIZATION",
    "resourceScope": "SELF",
    "resourceResolver": "PRINCIPAL_STUDENT",
    "defaultDeny": true
  },
  "getExemptionApplication": {
    "method": "GET",
    "route": "/exemption-applications/{applicationId}",
    "policyId": "EXEMPTION-APPLICATION-READ",
    "authentication": "ACCESS_TOKEN",
    "allowedRoles": [
      "STUDENT",
      "TEACHER",
      "ADMIN"
    ],
    "organizationScope": "PRINCIPAL_ORGANIZATION",
    "resourceScope": "ROLE_SCOPED",
    "resourceResolver": "NONE",
    "defaultDeny": true
  },
  "updateExemptionApplication": {
    "method": "PATCH",
    "route": "/exemption-applications/{applicationId}",
    "policyId": "EXEMPTION-APPLICATION-UPDATE",
    "authentication": "ACCESS_TOKEN",
    "allowedRoles": [
      "STUDENT"
    ],
    "organizationScope": "PRINCIPAL_ORGANIZATION",
    "resourceScope": "SELF",
    "resourceResolver": "PRINCIPAL_STUDENT",
    "defaultDeny": true
  },
  "submitExemptionApplication": {
    "method": "POST",
    "route": "/exemption-applications/{applicationId}/submit",
    "policyId": "EXEMPTION-APPLICATION-SUBMIT",
    "authentication": "ACCESS_TOKEN",
    "allowedRoles": [
      "STUDENT"
    ],
    "organizationScope": "PRINCIPAL_ORGANIZATION",
    "resourceScope": "SELF",
    "resourceResolver": "PRINCIPAL_STUDENT",
    "defaultDeny": true
  },
  "reviewExemptionApplication": {
    "method": "POST",
    "route": "/exemption-applications/{applicationId}/review",
    "policyId": "EXEMPTION-APPLICATION-REVIEW",
    "authentication": "ACCESS_TOKEN",
    "allowedRoles": [
      "TEACHER"
    ],
    "organizationScope": "PRINCIPAL_ORGANIZATION",
    "resourceScope": "TEACHER_CLASS_SECTION",
    "resourceResolver": "NONE",
    "defaultDeny": true
  },
  "getAppReleasePolicy": {
    "method": "GET",
    "route": "/app-release-policy",
    "policyId": "PUBLIC-APP-RELEASE-POLICY-READ",
    "authentication": "PUBLIC",
    "allowedRoles": [],
    "organizationScope": "NONE",
    "resourceScope": "NONE",
    "resourceResolver": "NONE",
    "defaultDeny": true
  },
  "getSportCatalog": {
    "method": "GET",
    "route": "/sport-catalog",
    "policyId": "SPORT-CATALOG-READ",
    "authentication": "ACCESS_TOKEN",
    "allowedRoles": [
      "STUDENT",
      "TEACHER",
      "ADMIN"
    ],
    "organizationScope": "PRINCIPAL_ORGANIZATION",
    "resourceScope": "ORGANIZATION",
    "resourceResolver": "PRINCIPAL_ORGANIZATION",
    "defaultDeny": true
  },
  "getActivityConversionRules": {
    "method": "GET",
    "route": "/activity-conversion-rules",
    "policyId": "ACTIVITY-CONVERSION-RULE-READ",
    "authentication": "ACCESS_TOKEN",
    "allowedRoles": [
      "STUDENT",
      "TEACHER",
      "ADMIN"
    ],
    "organizationScope": "PRINCIPAL_ORGANIZATION",
    "resourceScope": "ORGANIZATION",
    "resourceResolver": "PRINCIPAL_ORGANIZATION",
    "defaultDeny": true
  },
  "startExerciseLocationTrack": {
    "method": "POST",
    "route": "/exercise-sessions/{sessionId}/location-track",
    "policyId": "LOCATION-TRACK-START",
    "authentication": "ACCESS_TOKEN",
    "allowedRoles": [
      "STUDENT"
    ],
    "organizationScope": "PRINCIPAL_ORGANIZATION",
    "resourceScope": "SELF",
    "resourceResolver": "EXERCISE_SESSION_FROM_PATH",
    "defaultDeny": true
  },
  "appendExerciseLocationSamples": {
    "method": "POST",
    "route": "/exercise-sessions/{sessionId}/location-samples",
    "policyId": "LOCATION-SAMPLE-APPEND",
    "authentication": "ACCESS_TOKEN",
    "allowedRoles": [
      "STUDENT"
    ],
    "organizationScope": "PRINCIPAL_ORGANIZATION",
    "resourceScope": "SELF",
    "resourceResolver": "EXERCISE_SESSION_FROM_PATH",
    "defaultDeny": true
  },
  "finalizeExerciseLocationTrack": {
    "method": "POST",
    "route": "/exercise-sessions/{sessionId}/location-track/finalize",
    "policyId": "LOCATION-TRACK-FINALIZE",
    "authentication": "ACCESS_TOKEN",
    "allowedRoles": [
      "STUDENT"
    ],
    "organizationScope": "PRINCIPAL_ORGANIZATION",
    "resourceScope": "SELF",
    "resourceResolver": "EXERCISE_SESSION_FROM_PATH",
    "defaultDeny": true
  },
  "getExerciseRecordLocationSummary": {
    "method": "GET",
    "route": "/exercise-records/{recordId}/location-summary",
    "policyId": "LOCATION-SUMMARY-READ",
    "authentication": "ACCESS_TOKEN",
    "allowedRoles": [
      "STUDENT",
      "TEACHER",
      "ADMIN"
    ],
    "organizationScope": "PRINCIPAL_ORGANIZATION",
    "resourceScope": "ROLE_SCOPED",
    "resourceResolver": "EXERCISE_RECORD_FROM_PATH",
    "defaultDeny": true
  },
  "getLocationPrivacyPolicy": {
    "method": "GET",
    "route": "/location-privacy-policy",
    "policyId": "LOCATION-PRIVACY-POLICY-READ",
    "authentication": "ACCESS_TOKEN",
    "allowedRoles": [
      "STUDENT",
      "TEACHER",
      "ADMIN"
    ],
    "organizationScope": "PRINCIPAL_ORGANIZATION",
    "resourceScope": "ORGANIZATION",
    "resourceResolver": "PRINCIPAL_ORGANIZATION",
    "defaultDeny": true
  },
  "updateLocationPrivacyPolicy": {
    "method": "PATCH",
    "route": "/location-privacy-policy",
    "policyId": "LOCATION-PRIVACY-POLICY-UPDATE",
    "authentication": "ACCESS_TOKEN",
    "allowedRoles": [
      "ADMIN"
    ],
    "organizationScope": "PRINCIPAL_ORGANIZATION",
    "resourceScope": "ORGANIZATION",
    "resourceResolver": "PRINCIPAL_ORGANIZATION",
    "defaultDeny": true
  }
} as const;

export type OperationId = keyof typeof operationPolicies;
export type OperationPolicy = (typeof operationPolicies)[OperationId];

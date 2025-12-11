export interface EntryFormDictionary {
  form: {
    // Form fields
    confirmYourEntry: string;
    walletAddress: string;
    walletAddressLabel: string;
    emailLabel: string;
    emailPlaceholder: string;
    telegramLabel: string;
    telegramPlaceholder: string;

    // Actions
    confirmEntry: string;
    confirmEntryWithReflink: string;
    submittingEntry: string;

    // Wallet creation - shared
    dontHaveWallet: string;
    createWalletHere: string;

    // Mobile-specific progressive disclosure
    createMezoWallet: string;
    alreadyHaveWallet: string;
    enterGiveaway: string;
    needWallet: string;

    // Referrals
    haveReferralCode: string;
    referralCodePlaceholder: string;
    referralCodeFromLink: string;
    invalidReferralCodeFormat: string;

    // Labitconf Code
    labitconfCodeLabel: string;
    labitconfCodePlaceholder: string;

    // Success modal
    successTitle: string;
    successDescription: string;
    currentPosition: string;
    totalEntries: string;
    depositInfo: string;
    inviteFriends: string;
    inviteFriendsBonus: string;
    copyLink: string;
    shareOnX: string;
    shareOnXBonus: string;
    viewLeaderboard: string;
    linkCopied: string;
    tweetText: string;

    // Additional form copy
    multiplyOpportunities: string;
    yourReferralLink: string;
    privacyPolicy: string;
    privacyPolicyLink: string;
  };
  errors: {
    invalidWalletFormat: string;
    walletRequired: string;
    walletVerificationFailed: string;
    walletNotFoundOnMezo: string;
    duplicateWallet: string;
    invalidReferralCode: string;
    selfReferral: string;
    networkError: string;
    emailRequired: string;
    invalidEmail: string;
    invalidChecksum: string;
  };
}

export interface EntryFormComponentProps {
  dict: EntryFormDictionary;
  lang: string;
}

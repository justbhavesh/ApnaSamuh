// All Hindi UI strings in one place. To add another language later, swap this
// module for react-i18next with this object as the `hi` resource.

export const hi = {
  appName: "ApnaSamuh",
  group: "ग्राम कोष — रामपुर",
  // roles
  admin: "कोषाध्यक्ष",
  member: "सदस्य",
  // tabs
  home: "होम",
  members: "सदस्य",
  loans: "कर्ज",
  reports: "रिपोर्ट",
  myAccount: "मेरा खाता",
  fund: "कुल कोष",
  history: "इतिहास",
  // dashboard
  totalFund: "कुल कोष",
  availableToLend: "कर्ज देने योग्य",
  outOnLoan: "कर्ज बाहर",
  thisMonthDeposit: "इस महीने का जमा",
  recordDeposit: "जमा दर्ज करें",
  accumulatedProfit: "जमा लाभ (अब तक)",
  // members
  memberCount: (n: number) => `सदस्य (${n})`,
  monthly: "मासिक",
  addMember: "नया सदस्य जोड़ें",
  name: "नाम",
  phone: "फ़ोन",
  monthlyAmount: "मासिक राशि (₹100–₹1000)",
  save: "सेव करें",
  cancel: "रद्द करें",
  // deposits
  take: "जमा लें",
  lateFeeLabel: "विलंब",
  recorded: "✅ दर्ज हुआ",
  sendWhatsapp: "WhatsApp पर भेजें",
  confirmTake: (name: string, amt: string) => `${name} से ${amt} जमा लें?`,
  yes: "हाँ",
  no: "नहीं",
  // status
  paid: "भुगतान हुआ",
  pending: "बाकी है",
  late: "देर",
  // loans
  newLoan: "नया कर्ज दें",
  giveLoan: "कर्ज दें",
  loanAmount: "कर्ज राशि (₹)",
  selectMember: "सदस्य चुनें",
  ratePerMonth: (pct: string) => `${pct}% प्रति माह`,
  outstandingPrincipal: "बकाया मूलधन",
  thisMonthInterest: "इस माह ब्याज",
  recordRepayment: "वापसी दर्ज करें",
  repayAmount: "राशि लें (₹)",
  active: "सक्रिय",
  loanClosed: "✅ कर्ज पूरा हुआ",
  noLoans: "अभी कोई सक्रिय कर्ज नहीं",
  insufficientFunds: "कर्ज देने योग्य राशि से अधिक — कम राशि डालें",
  back: "वापस",
  repaySplit: (interest: string, principal: string) =>
    `ब्याज ${interest} + मूलधन ${principal}`,
  // reports
  totalDeposits: "कुल जमा",
  totalInterestProfit: "कुल ब्याज लाभ",
  totalLateFeesLabel: "विलंब शुल्क",
  activeLoansLabel: "सक्रिय कर्ज",
  memberStatements: "सदस्य विवरण",
  loanOutstanding: "बकाया कर्ज",
  shareReport: "रिपोर्ट साझा करें",
  // profit distribution
  profitDistribution: "लाभ वितरण",
  undistributedProfit: "बाँटने योग्य लाभ",
  distribute: "लाभ बाँटें",
  ruleProportional: "जमा के अनुपात में",
  ruleEqual: "सबको बराबर",
  previewDistribution: "वितरण देखें",
  confirmDistribute: "लाभ बाँट दें? यह वापस नहीं होगा।",
  distributedDone: "✅ लाभ बाँट दिया गया",
  noProfitToShare: "अभी बाँटने के लिए लाभ नहीं है",
  // settings
  settings: "सेटिंग",
  groupName: "समिति का नाम",
  dueDate: "हर महीने की नियत तारीख",
  lateFeeAmount: "विलंब शुल्क (₹)",
  interestRatePercent: "ब्याज दर (% प्रति माह)",
  dueDateHint: (day: number, fee: string) =>
    `हर महीने ${day} तारीख तक जमा करें। बाद में जमा करने पर ${fee} विलंब शुल्क लगेगा।`,
  saved: "✅ सेव हुआ",
  // deposit payment date
  paymentDate: "जमा की तारीख",
  onTime: "समय पर ✓",
  lateWithFee: (fee: string) => `देर — ${fee} विलंब`,
  // member login + PIN
  login: "लॉगिन",
  enterPhone: "फ़ोन नंबर",
  enterPin: "पिन (4 अंक)",
  loginBtn: "खाता खोलें",
  loginFailed: "फ़ोन नंबर या पिन गलत है",
  logout: "बाहर निकलें",
  memberLoginHint: "कोषाध्यक्ष से अपना पिन लें",
  setPin: "पिन",
  newPin: "नया पिन (4 अंक)",
  pinSetDone: "✅ पिन सेट हुआ",
  // member view
  greeting: (name: string) => `नमस्ते, ${name} 🙏`,
  myTotalDeposit: "मेरा कुल जमा",
  myLoan: "मेरा कर्ज",
  transparency:
    "सभी सदस्य कोष की राशि और कर्ज देने योग्य राशि देख सकते हैं — पूरी पारदर्शिता",
  // misc
  offline: "इंटरनेट नहीं — डेटा फ़ोन में सुरक्षित है",
  noMembers: "अभी कोई सदस्य नहीं — पहला सदस्य जोड़ें",
};

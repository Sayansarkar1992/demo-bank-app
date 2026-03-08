const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const swaggerUi = require('swagger-ui-express');

const app = express();
const PORT = process.env.PORT || 3000;

const uploadDir = path.join(__dirname, 'public', 'uploads');
const downloadDir = path.join(__dirname, 'public', 'downloads');

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
if (!fs.existsSync(downloadDir)) fs.mkdirSync(downloadDir, { recursive: true });

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}-${safeName}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }
});

const users = [
  {
    id: 'u-demo-001',
    fullName: 'Demo User',
    email: 'demo@bank.test',
    password: 'Demo@123',
    phone: '9999999999'
  }
];

const sessions = new Map();

const accountData = {
  savings: {
    accountNumber: 'SA-100200300',
    balance: 152340.5,
    currency: 'INR',
    interestRate: '4.0%',
    transactions: [
      { id: 'S1', date: '2026-03-01', type: 'Credit', amount: 5500, narration: 'Salary Credit' },
      { id: 'S2', date: '2026-03-03', type: 'Debit', amount: 1700, narration: 'Online Shopping' },
      { id: 'S3', date: '2026-03-04', type: 'Debit', amount: 250, narration: 'UPI Transfer' }
    ]
  },
  current: {
    accountNumber: 'CA-400500600',
    balance: 432100.15,
    currency: 'INR',
    overdraftLimit: 50000,
    transactions: [
      { id: 'C1', date: '2026-03-02', type: 'Credit', amount: 120000, narration: 'Client Payment' },
      { id: 'C2', date: '2026-03-05', type: 'Debit', amount: 45000, narration: 'Vendor Settlement' }
    ]
  },
  loan: {
    activeLoans: [
      { id: 'L-001', type: 'Home Loan', outstanding: 3250000, emi: 28900, tenureMonths: 180 }
    ],
    offers: [
      { id: 'O-PL', name: 'Personal Loan', maxAmount: 1000000, interest: '11.5%' },
      { id: 'O-EL', name: 'Education Loan', maxAmount: 2000000, interest: '9.2%' }
    ]
  },
  creditCard: {
    cardNumberMasked: '4111-XXXX-XXXX-1020',
    availableLimit: 180000,
    totalLimit: 250000,
    dueAmount: 8450,
    dueDate: '2026-03-20',
    status: 'ACTIVE',
    blockedAt: null,
    blockedReason: null,
    rewardPoints: 12450,
    autopayEnabled: false,
    activeCardVariant: 'Platinum',
    availableCardTypes: ['Classic', 'Gold', 'Platinum', 'Signature'],
    eligibleUpgradeVariants: ['Signature'],
    controls: {
      onlineTransactions: true,
      contactlessPayments: true,
      internationalUsage: false,
      atmCashWithdrawal: true
    },
    applications: [],
    upgradeHistory: [],
    unbilledTransactions: [
      { id: 'UB1', date: '2026-03-06', merchant: 'Amazon', category: 'Shopping', amount: 2499 },
      { id: 'UB2', date: '2026-03-07', merchant: 'Swiggy', category: 'Food', amount: 799 },
      { id: 'UB3', date: '2026-03-07', merchant: 'Uber', category: 'Travel', amount: 540 }
    ],
    lastStatement: {
      statementMonth: 'February 2026',
      billingPeriod: '2026-02-01 to 2026-02-28',
      generatedOn: '2026-03-01',
      totalSpend: 22840,
      minimumDue: 1142,
      transactions: [
        { id: 'ST1', date: '2026-02-02', merchant: 'Reliance Fresh', amount: 1840 },
        { id: 'ST2', date: '2026-02-11', merchant: 'BookMyShow', amount: 620 },
        { id: 'ST3', date: '2026-02-14', merchant: 'Flipkart', amount: 9750 },
        { id: 'ST4', date: '2026-02-21', merchant: 'IRCTC', amount: 10630 }
      ]
    }
  }
};

const customerProfile = {
  customerId: 'CUST-889901',
  fullName: 'Demo User',
  relationshipSince: '2018-09-14',
  kycStatus: 'VERIFIED',
  profileCompletion: 92,
  lastLoginAt: new Date().toISOString(),
  lastLoginLocation: 'Bengaluru, IN',
  riskLevel: 'LOW'
};

const notifications = [
  {
    id: 'N-1001',
    title: 'Welcome to Demo Bank',
    message: 'Your account is active and ready for digital banking.',
    priority: 'info',
    read: false,
    createdAt: '2026-03-01T10:30:00.000Z'
  },
  {
    id: 'N-1002',
    title: 'Credit Card Bill Due',
    message: 'Your credit card due amount is INR 8450 due on 2026-03-20.',
    priority: 'high',
    read: false,
    createdAt: '2026-03-07T08:15:00.000Z'
  }
];

const serviceRequests = [
  {
    id: 'SR-1001',
    category: 'Debit Card',
    subject: 'PIN generation support',
    description: 'Need help with ATM PIN generation flow.',
    status: 'OPEN',
    priority: 'NORMAL',
    createdAt: '2026-03-05T09:45:00.000Z'
  }
];

const bankingOffers = [
  {
    id: 'OFF-001',
    title: 'Pre-approved Personal Loan',
    bannerText: 'Get up to INR 10,00,000 at low interest',
    description: 'Complete your loan journey digitally in under 5 minutes.',
    ctaText: 'Apply Now',
    ctaLink: '/loan.html',
    popup: true,
    category: 'Loan'
  },
  {
    id: 'OFF-002',
    title: 'Lifetime Free Signature Credit Card',
    bannerText: '5X reward points on travel and dining',
    description: 'Upgrade and enjoy complimentary lounge access.',
    ctaText: 'Upgrade Card',
    ctaLink: '/credit-card.html',
    popup: true,
    category: 'Card'
  },
  {
    id: 'OFF-003',
    title: 'Fixed Deposit Booster',
    bannerText: 'Extra 0.5% for senior citizen nominee accounts',
    description: 'Lock your savings with higher guaranteed returns.',
    ctaText: 'Know More',
    ctaLink: '/home.html',
    popup: false,
    category: 'Deposit'
  }
];

function createToken() {
  return crypto.randomBytes(18).toString('hex');
}

function createSession(user) {
  const token = createToken();
  sessions.set(token, { userId: user.id, createdAt: Date.now() });
  return token;
}

function pushNotification(title, message, priority = 'info') {
  const notification = {
    id: `N-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
    title,
    message,
    priority,
    read: false,
    createdAt: new Date().toISOString()
  };
  notifications.unshift(notification);
  return notification;
}

function getUserFromToken(token) {
  if (!token) return null;
  const session = sessions.get(token);
  if (!session) return null;
  return users.find((u) => u.id === session.userId) || null;
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
  const user = getUserFromToken(token);
  if (!user) {
    return res.status(401).json({
      message: 'Unauthorized. Provide a valid Bearer token.'
    });
  }
  req.user = user;
  return next();
}

function validateRegistration(body) {
  const errors = {};

  if (!body.fullName || body.fullName.trim().length < 3) {
    errors.fullName = 'Full name must be at least 3 characters.';
  }

  if (!body.email || !/^[\w.-]+@[\w.-]+\.[A-Za-z]{2,}$/.test(body.email)) {
    errors.email = 'Enter a valid email address.';
  }

  if (!body.password || body.password.length < 6) {
    errors.password = 'Password must be at least 6 characters.';
  }

  if (!body.phone || !/^\d{10}$/.test(body.phone)) {
    errors.phone = 'Phone must contain exactly 10 digits.';
  }

  return errors;
}

function validateLoanApplication(body) {
  const errors = {};
  const amount = Number(body.amount);
  const tenureMonths = Number(body.tenureMonths);

  if (!Number.isFinite(amount) || amount < 10000) {
    errors.amount = 'Loan amount must be at least 10000.';
  }

  if (!Number.isInteger(tenureMonths) || tenureMonths < 6 || tenureMonths > 360) {
    errors.tenureMonths = 'Tenure must be between 6 and 360 months.';
  }

  if (!body.purpose || body.purpose.trim().length < 3) {
    errors.purpose = 'Purpose is required.';
  }

  return errors;
}

function validateAccountTransaction(body) {
  const errors = {};
  const amount = Number(body.amount);
  const narration = (body.narration || '').trim();

  if (!Number.isFinite(amount) || amount <= 0) {
    errors.amount = 'Amount must be greater than 0.';
  }

  if (narration && narration.length < 3) {
    errors.narration = 'Narration must be at least 3 characters when provided.';
  }

  return { errors, amount, narration: narration || 'Manual transaction' };
}

function validateCreditCardApplication(body) {
  const errors = {};
  const requestedCardType = (body.requestedCardType || '').trim();
  const monthlyIncome = Number(body.monthlyIncome);
  const employmentType = (body.employmentType || '').trim();

  if (!accountData.creditCard.availableCardTypes.includes(requestedCardType)) {
    errors.requestedCardType = 'Choose a valid card type.';
  }

  if (!Number.isFinite(monthlyIncome) || monthlyIncome < 15000) {
    errors.monthlyIncome = 'Monthly income must be at least 15000.';
  }

  if (!employmentType || employmentType.length < 2) {
    errors.employmentType = 'Employment type is required.';
  }

  return { errors, requestedCardType, monthlyIncome, employmentType };
}

function validateCreditCardUpgrade(body) {
  const errors = {};
  const targetVariant = (body.targetVariant || '').trim();

  if (!targetVariant) {
    errors.targetVariant = 'Target variant is required.';
  } else if (targetVariant === accountData.creditCard.activeCardVariant) {
    errors.targetVariant = 'You are already using this variant.';
  } else if (!accountData.creditCard.availableCardTypes.includes(targetVariant)) {
    errors.targetVariant = 'Invalid target variant.';
  }

  return { errors, targetVariant };
}

function validateCardControls(body) {
  const errors = {};
  const keys = ['onlineTransactions', 'contactlessPayments', 'internationalUsage', 'atmCashWithdrawal'];

  keys.forEach((key) => {
    if (typeof body[key] !== 'boolean') {
      errors[key] = 'Must be boolean.';
    }
  });

  return { errors };
}

function validateCardBlock(body) {
  const errors = {};
  const reason = (body.reason || '').trim();

  if (!reason || reason.length < 5) {
    errors.reason = 'Reason must be at least 5 characters.';
  }

  return { errors, reason };
}

function validateCardUnblock(body) {
  const errors = {};
  const otp = String(body.otp || '').trim();

  if (!otp) {
    errors.otp = 'OTP is required.';
  } else if (!/^\d{6}$/.test(otp)) {
    errors.otp = 'OTP must be 6 digits.';
  } else if (otp !== '123456') {
    errors.otp = 'Invalid OTP. Use demo OTP 123456.';
  }

  return { errors, otp };
}

function validateCardBillPayment(body) {
  const errors = {};
  const amount = Number(body.amount);
  const source = (body.source || '').trim();

  if (!Number.isFinite(amount) || amount <= 0) {
    errors.amount = 'Payment amount must be greater than 0.';
  }

  if (source && source.length < 2) {
    errors.source = 'Payment source is invalid.';
  }

  return { errors, amount, source: source || 'Savings Account' };
}

function validateServiceRequest(body) {
  const errors = {};
  const category = (body.category || '').trim();
  const subject = (body.subject || '').trim();
  const description = (body.description || '').trim();
  const priority = (body.priority || 'NORMAL').trim().toUpperCase();

  if (!category || category.length < 2) {
    errors.category = 'Category is required.';
  }

  if (!subject || subject.length < 5) {
    errors.subject = 'Subject must be at least 5 characters.';
  }

  if (!description || description.length < 10) {
    errors.description = 'Description must be at least 10 characters.';
  }

  if (!['LOW', 'NORMAL', 'HIGH'].includes(priority)) {
    errors.priority = 'Priority must be LOW, NORMAL, or HIGH.';
  }

  return { errors, category, subject, description, priority };
}

function createAccountTransaction(accountKey, type, amount, narration) {
  const account = accountData[accountKey];
  const prefix = accountKey === 'savings' ? 'S' : 'C';
  const tx = {
    id: `${prefix}${Date.now()}`,
    date: new Date().toISOString().split('T')[0],
    type,
    amount,
    narration
  };
  account.transactions.push(tx);
  return tx;
}

function toCsvCell(value) {
  const str = String(value ?? '');
  if (str.includes('"') || str.includes(',') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function buildPassbookCsv(account, label) {
  const rows = [
    ['Account Type', label],
    ['Account Number', account.accountNumber],
    ['Currency', account.currency],
    ['Current Balance', account.balance],
    [],
    ['Transaction ID', 'Date', 'Type', 'Amount', 'Narration']
  ];

  account.transactions.forEach((tx) => {
    rows.push([tx.id, tx.date, tx.type, tx.amount, tx.narration]);
  });

  return `${rows.map((row) => row.map(toCsvCell).join(',')).join('\n')}\n`;
}

function buildCreditCardStatementCsv(card) {
  const statement = card.lastStatement;
  const rows = [
    ['Statement Month', statement.statementMonth],
    ['Billing Period', statement.billingPeriod],
    ['Generated On', statement.generatedOn],
    ['Card Variant', card.activeCardVariant],
    ['Total Spend', statement.totalSpend],
    ['Minimum Due', statement.minimumDue],
    [],
    ['Transaction ID', 'Date', 'Merchant', 'Amount']
  ];

  statement.transactions.forEach((tx) => {
    rows.push([tx.id, tx.date, tx.merchant, tx.amount]);
  });

  return `${rows.map((row) => row.map(toCsvCell).join(',')).join('\n')}\n`;
}

const openApiPath = path.join(__dirname, 'openapi.json');
let swaggerDocument = {
  openapi: '3.0.0',
  info: { title: 'Demo Bank API', version: '1.0.0' }
};
if (fs.existsSync(openApiPath)) {
  swaggerDocument = JSON.parse(fs.readFileSync(openApiPath, 'utf8'));
}

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, { explorer: true }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'demo-bank-api', time: new Date().toISOString() });
});

app.post('/api/testing/echo', (req, res) => {
  res.json({
    message: 'Echo response generated.',
    method: req.method,
    path: req.path,
    headers: req.headers,
    body: req.body,
    query: req.query,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/testing/status/:code', (req, res) => {
  const code = Number(req.params.code);
  if (!Number.isInteger(code) || code < 100 || code > 599) {
    return res.status(400).json({ message: 'Status code must be between 100 and 599.' });
  }
  return res.status(code).json({
    message: `Forced status response: ${code}`,
    forcedCode: code,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/testing/delay/:ms', async (req, res) => {
  const ms = Number(req.params.ms);
  if (!Number.isInteger(ms) || ms < 0 || ms > 5000) {
    return res.status(400).json({ message: 'Delay must be an integer between 0 and 5000 ms.' });
  }
  await new Promise((resolve) => setTimeout(resolve, ms));
  return res.json({
    message: `Delayed response by ${ms} ms.`,
    delayedByMs: ms,
    timestamp: new Date().toISOString()
  });
});

app.post('/api/auth/demo-login', (_req, res) => {
  const demoUser = users.find((u) => u.email === 'demo@bank.test');
  const token = createSession(demoUser);
  customerProfile.lastLoginAt = new Date().toISOString();
  customerProfile.lastLoginLocation = 'Bengaluru, IN';
  res.json({
    message: 'Demo user signed in.',
    token,
    user: {
      id: demoUser.id,
      fullName: demoUser.fullName,
      email: demoUser.email
    }
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: 'Email and password are required.',
      errors: {
        email: !email ? 'Email is required.' : undefined,
        password: !password ? 'Password is required.' : undefined
      }
    });
  }

  const user = users.find((u) => u.email === email && u.password === password);
  if (!user) {
    return res.status(401).json({
      message: 'Invalid credentials.',
      errors: {
        email: 'Email or password is invalid.'
      }
    });
  }

  const token = createSession(user);
  customerProfile.lastLoginAt = new Date().toISOString();
  customerProfile.lastLoginLocation = 'Bengaluru, IN';
  return res.json({
    message: 'Login successful.',
    token,
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email
    }
  });
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
  res.json({
    id: req.user.id,
    fullName: req.user.fullName,
    email: req.user.email
  });
});

app.get('/api/customer/dashboard', authMiddleware, (_req, res) => {
  const unreadNotifications = notifications.filter((item) => !item.read).length;
  res.json({
    ...customerProfile,
    unreadNotifications,
    openServiceRequests: serviceRequests.filter((item) => item.status !== 'CLOSED').length
  });
});

app.get('/api/notifications', authMiddleware, (_req, res) => {
  res.json({
    count: notifications.length,
    unreadCount: notifications.filter((item) => !item.read).length,
    items: notifications
  });
});

app.post('/api/notifications/:id/read', authMiddleware, (req, res) => {
  const notification = notifications.find((item) => item.id === req.params.id);
  if (!notification) {
    return res.status(404).json({ message: 'Notification not found.' });
  }
  notification.read = true;
  return res.json({
    message: 'Notification marked as read.',
    notification
  });
});

app.get('/api/offers/active', authMiddleware, (_req, res) => {
  res.json({
    asOf: new Date().toISOString(),
    offers: bankingOffers
  });
});

app.get('/api/support/requests', authMiddleware, (_req, res) => {
  res.json({
    count: serviceRequests.length,
    items: serviceRequests
  });
});

app.post('/api/support/requests', authMiddleware, (req, res) => {
  const { errors, category, subject, description, priority } = validateServiceRequest(req.body);
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ message: 'Validation failed.', errors });
  }

  const request = {
    id: `SR-${Date.now()}`,
    category,
    subject,
    description,
    status: 'OPEN',
    priority,
    createdAt: new Date().toISOString()
  };
  serviceRequests.unshift(request);
  pushNotification('Service Request Created', `Request ${request.id} was created for ${category}.`, 'info');

  return res.status(201).json({
    message: 'Service request submitted.',
    request
  });
});

app.post('/api/auth/register', upload.single('document'), (req, res) => {
  const errors = validateRegistration(req.body);

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ message: 'Validation failed.', errors });
  }

  const emailExists = users.some((u) => u.email === req.body.email);
  if (emailExists) {
    return res.status(409).json({
      message: 'User already exists.',
      errors: { email: 'Email already registered.' }
    });
  }

  const newUser = {
    id: `u-${Date.now()}`,
    fullName: req.body.fullName,
    email: req.body.email,
    password: req.body.password,
    phone: req.body.phone,
    document: req.file
      ? {
          filename: req.file.filename,
          originalname: req.file.originalname,
          size: req.file.size
        }
      : null
  };

  users.push(newUser);
  return res.status(201).json({
    message: 'Registration successful.',
    user: {
      id: newUser.id,
      fullName: newUser.fullName,
      email: newUser.email,
      phone: newUser.phone,
      document: newUser.document
    }
  });
});

app.post('/api/files/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'File is required.' });
  }

  return res.status(201).json({
    message: 'File uploaded successfully.',
    file: {
      filename: req.file.filename,
      originalname: req.file.originalname,
      size: req.file.size
    }
  });
});

app.get('/api/files/list', (_req, res) => {
  const files = fs
    .readdirSync(uploadDir)
    .filter((name) => !name.startsWith('.'))
    .map((name) => {
      const fullPath = path.join(uploadDir, name);
      const stats = fs.statSync(fullPath);
      return {
        filename: name,
        size: stats.size,
        modifiedAt: stats.mtime.toISOString()
      };
    });
  res.json({ files });
});

app.get('/api/files/download/:filename', (req, res) => {
  const safeName = path.basename(req.params.filename);
  const filePath = path.join(uploadDir, safeName);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: 'File not found.' });
  }

  return res.download(filePath);
});

app.get('/api/files/template', (_req, res) => {
  const templatePath = path.join(downloadDir, 'registration-template.csv');
  if (!fs.existsSync(templatePath)) {
    return res.status(404).json({ message: 'Template not found.' });
  }
  return res.download(templatePath);
});

app.get('/api/accounts/summary', authMiddleware, (_req, res) => {
  res.json({
    savings: {
      accountNumber: accountData.savings.accountNumber,
      balance: accountData.savings.balance,
      currency: accountData.savings.currency
    },
    current: {
      accountNumber: accountData.current.accountNumber,
      balance: accountData.current.balance,
      currency: accountData.current.currency
    },
    loan: {
      count: accountData.loan.activeLoans.length,
      outstandingTotal: accountData.loan.activeLoans.reduce((sum, l) => sum + l.outstanding, 0)
    },
    creditCard: {
      cardNumberMasked: accountData.creditCard.cardNumberMasked,
      availableLimit: accountData.creditCard.availableLimit,
      status: accountData.creditCard.status,
      dueAmount: accountData.creditCard.dueAmount
    }
  });
});

app.get('/api/accounts/savings', authMiddleware, (_req, res) => {
  res.json(accountData.savings);
});

app.get('/api/accounts/current', authMiddleware, (_req, res) => {
  res.json(accountData.current);
});

app.post('/api/accounts/savings/deposit', authMiddleware, (req, res) => {
  const { errors, amount, narration } = validateAccountTransaction(req.body);
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ message: 'Validation failed.', errors });
  }

  accountData.savings.balance += amount;
  const tx = createAccountTransaction('savings', 'Credit', amount, narration);
  return res.status(201).json({
    message: 'Amount deposited to savings account.',
    balance: accountData.savings.balance,
    transaction: tx
  });
});

app.post('/api/accounts/savings/withdraw', authMiddleware, (req, res) => {
  const { errors, amount, narration } = validateAccountTransaction(req.body);
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ message: 'Validation failed.', errors });
  }

  if (amount > accountData.savings.balance) {
    return res.status(400).json({
      message: 'Insufficient savings balance.',
      errors: { amount: 'Withdraw amount exceeds available savings balance.' }
    });
  }

  accountData.savings.balance -= amount;
  const tx = createAccountTransaction('savings', 'Debit', amount, narration);
  return res.status(201).json({
    message: 'Amount withdrawn from savings account.',
    balance: accountData.savings.balance,
    transaction: tx
  });
});

app.get('/api/accounts/savings/passbook', authMiddleware, (_req, res) => {
  const csv = buildPassbookCsv(accountData.savings, 'Savings');
  const stamp = new Date().toISOString().slice(0, 10);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=\"savings-passbook-${stamp}.csv\"`);
  return res.send(csv);
});

app.post('/api/accounts/current/deposit', authMiddleware, (req, res) => {
  const { errors, amount, narration } = validateAccountTransaction(req.body);
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ message: 'Validation failed.', errors });
  }

  accountData.current.balance += amount;
  const tx = createAccountTransaction('current', 'Credit', amount, narration);
  return res.status(201).json({
    message: 'Amount deposited to current account.',
    balance: accountData.current.balance,
    transaction: tx
  });
});

app.post('/api/accounts/current/withdraw', authMiddleware, (req, res) => {
  const { errors, amount, narration } = validateAccountTransaction(req.body);
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ message: 'Validation failed.', errors });
  }

  const maxWithdrawable = accountData.current.balance + accountData.current.overdraftLimit;
  if (amount > maxWithdrawable) {
    return res.status(400).json({
      message: 'Withdraw exceeds current balance and overdraft limit.',
      errors: { amount: 'Allowed up to current balance + overdraft limit.' }
    });
  }

  accountData.current.balance -= amount;
  const tx = createAccountTransaction('current', 'Debit', amount, narration);
  return res.status(201).json({
    message: 'Amount withdrawn from current account.',
    balance: accountData.current.balance,
    transaction: tx
  });
});

app.get('/api/accounts/current/passbook', authMiddleware, (_req, res) => {
  const csv = buildPassbookCsv(accountData.current, 'Current');
  const stamp = new Date().toISOString().slice(0, 10);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=\"current-passbook-${stamp}.csv\"`);
  return res.send(csv);
});

app.get('/api/cards/credit', authMiddleware, (_req, res) => {
  const unbilledTotal = accountData.creditCard.unbilledTransactions.reduce((sum, tx) => sum + tx.amount, 0);
  res.json({
    ...accountData.creditCard,
    unbilledTotal
  });
});

app.post('/api/cards/credit/apply', authMiddleware, (req, res) => {
  if (accountData.creditCard.status === 'BLOCKED') {
    return res.status(423).json({ message: 'Card services are temporarily locked while card is blocked.' });
  }

  const { errors, requestedCardType, monthlyIncome, employmentType } = validateCreditCardApplication(req.body);
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ message: 'Validation failed.', errors });
  }

  const application = {
    id: `CCA-${Date.now()}`,
    requestedCardType,
    monthlyIncome,
    employmentType,
    status: 'UNDER_REVIEW',
    appliedAt: new Date().toISOString()
  };
  accountData.creditCard.applications.push(application);
  pushNotification('Card Application Submitted', `Application ${application.id} is under review.`, 'info');

  return res.status(201).json({
    message: 'New credit card application submitted.',
    application
  });
});

app.post('/api/cards/credit/upgrade', authMiddleware, (req, res) => {
  if (accountData.creditCard.status === 'BLOCKED') {
    return res.status(423).json({ message: 'Card upgrade is unavailable while card is blocked.' });
  }

  const { errors, targetVariant } = validateCreditCardUpgrade(req.body);
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ message: 'Validation failed.', errors });
  }

  if (
    accountData.creditCard.eligibleUpgradeVariants.length > 0 &&
    !accountData.creditCard.eligibleUpgradeVariants.includes(targetVariant)
  ) {
    return res.status(400).json({
      message: 'You are not eligible for this upgrade currently.',
      errors: { targetVariant: 'Select an eligible variant.' }
    });
  }

  const variantLimitMap = {
    Classic: 120000,
    Gold: 200000,
    Platinum: 250000,
    Signature: 400000
  };

  const oldTotalLimit = accountData.creditCard.totalLimit;
  const usedAmount = oldTotalLimit - accountData.creditCard.availableLimit;
  const newTotalLimit = variantLimitMap[targetVariant] || oldTotalLimit;
  const newAvailableLimit = Math.max(newTotalLimit - usedAmount, 0);

  const upgradeEvent = {
    id: `CCU-${Date.now()}`,
    fromVariant: accountData.creditCard.activeCardVariant,
    toVariant: targetVariant,
    previousLimit: oldTotalLimit,
    upgradedLimit: newTotalLimit,
    upgradedAt: new Date().toISOString()
  };

  accountData.creditCard.activeCardVariant = targetVariant;
  accountData.creditCard.totalLimit = newTotalLimit;
  accountData.creditCard.availableLimit = newAvailableLimit;
  accountData.creditCard.eligibleUpgradeVariants = accountData.creditCard.eligibleUpgradeVariants.filter(
    (variant) => variant !== targetVariant
  );
  accountData.creditCard.upgradeHistory.push(upgradeEvent);
  pushNotification('Card Upgrade Successful', `Card upgraded to ${targetVariant}.`, 'high');

  return res.status(201).json({
    message: 'Credit card upgraded successfully.',
    upgrade: upgradeEvent,
    card: {
      activeCardVariant: accountData.creditCard.activeCardVariant,
      totalLimit: accountData.creditCard.totalLimit,
      availableLimit: accountData.creditCard.availableLimit
    }
  });
});

app.get('/api/cards/credit/statement/latest', authMiddleware, (_req, res) => {
  const csv = buildCreditCardStatementCsv(accountData.creditCard);
  const stamp = new Date().toISOString().slice(0, 10);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=\"credit-card-statement-${stamp}.csv\"`);
  return res.send(csv);
});

app.get('/api/cards/credit/unbilled-transactions', authMiddleware, (_req, res) => {
  const transactions = accountData.creditCard.unbilledTransactions;
  const totalAmount = transactions.reduce((sum, tx) => sum + tx.amount, 0);
  res.json({
    asOf: new Date().toISOString(),
    totalAmount,
    transactions
  });
});

app.get('/api/cards/credit/controls', authMiddleware, (_req, res) => {
  res.json(accountData.creditCard.controls);
});

app.put('/api/cards/credit/controls', authMiddleware, (req, res) => {
  if (accountData.creditCard.status === 'BLOCKED') {
    return res.status(423).json({ message: 'Card controls cannot be changed while card is blocked.' });
  }

  const { errors } = validateCardControls(req.body);
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ message: 'Validation failed.', errors });
  }

  accountData.creditCard.controls = {
    ...accountData.creditCard.controls,
    ...req.body
  };

  return res.json({
    message: 'Card controls updated.',
    controls: accountData.creditCard.controls
  });
});

app.post('/api/cards/credit/block', authMiddleware, (req, res) => {
  if (accountData.creditCard.status === 'BLOCKED') {
    return res.status(400).json({ message: 'Card is already blocked.' });
  }

  const { errors, reason } = validateCardBlock(req.body);
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ message: 'Validation failed.', errors });
  }

  accountData.creditCard.status = 'BLOCKED';
  accountData.creditCard.blockedReason = reason;
  accountData.creditCard.blockedAt = new Date().toISOString();
  pushNotification('Card Blocked', `Your card was blocked for reason: ${reason}`, 'high');

  return res.json({
    message: 'Card blocked successfully.',
    status: accountData.creditCard.status,
    blockedAt: accountData.creditCard.blockedAt,
    blockedReason: accountData.creditCard.blockedReason
  });
});

app.post('/api/cards/credit/unblock', authMiddleware, (req, res) => {
  if (accountData.creditCard.status !== 'BLOCKED') {
    return res.status(400).json({ message: 'Card is already active.' });
  }

  const { errors } = validateCardUnblock(req.body);
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ message: 'Validation failed.', errors });
  }

  accountData.creditCard.status = 'ACTIVE';
  accountData.creditCard.blockedReason = null;
  accountData.creditCard.blockedAt = null;
  pushNotification('Card Unblocked', 'Your credit card has been unblocked successfully.', 'info');

  return res.json({
    message: 'Card unblocked successfully.',
    status: accountData.creditCard.status
  });
});

app.post('/api/cards/credit/pay-bill', authMiddleware, (req, res) => {
  if (accountData.creditCard.status === 'BLOCKED') {
    return res.status(423).json({
      message: 'Cannot pay bill while card is blocked. Please unblock card first.'
    });
  }

  const { errors, amount, source } = validateCardBillPayment(req.body);
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ message: 'Validation failed.', errors });
  }

  if (amount > accountData.creditCard.dueAmount) {
    return res.status(400).json({
      message: 'Payment exceeds due amount.',
      errors: { amount: 'Enter amount less than or equal to due amount.' }
    });
  }

  accountData.creditCard.dueAmount = Number((accountData.creditCard.dueAmount - amount).toFixed(2));
  accountData.creditCard.availableLimit = Math.min(
    accountData.creditCard.totalLimit,
    Number((accountData.creditCard.availableLimit + amount).toFixed(2))
  );

  const payment = {
    id: `CCP-${Date.now()}`,
    amount,
    source,
    paidAt: new Date().toISOString()
  };
  pushNotification('Credit Card Payment Received', `Payment of INR ${amount} posted from ${source}.`, 'info');

  return res.status(201).json({
    message: 'Credit card bill payment successful.',
    payment,
    dueAmount: accountData.creditCard.dueAmount,
    availableLimit: accountData.creditCard.availableLimit
  });
});

app.get('/api/loans', authMiddleware, (_req, res) => {
  res.json(accountData.loan);
});

app.post('/api/loans/apply', authMiddleware, (req, res) => {
  const errors = validateLoanApplication(req.body);
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ message: 'Validation failed.', errors });
  }

  const newLoan = {
    id: `L-${Date.now()}`,
    type: req.body.loanType || 'Personal Loan',
    outstanding: Number(req.body.amount),
    emi: Math.round(Number(req.body.amount) / Number(req.body.tenureMonths)),
    tenureMonths: Number(req.body.tenureMonths),
    purpose: req.body.purpose,
    status: 'PENDING_REVIEW'
  };

  accountData.loan.activeLoans.push(newLoan);
  return res.status(201).json({
    message: 'Loan application submitted.',
    application: newLoan
  });
});

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (_req, res) => {
  res.redirect('/login.html');
});

app.use((_req, res) => {
  res.status(404).json({ message: 'Route not found.' });
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Demo Bank app running at http://localhost:${PORT}`);
});

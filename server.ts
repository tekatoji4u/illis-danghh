import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json());

// Default preconfigured account credentials provided by user
let currentCredentials = {
  username: process.env.ILIS_USERNAME || 'DanghhBL',
  password: process.env.ILIS_PASSWORD || 'Hhdang61'
};

interface UserSession {
  jwtToken: string;
  expiresAt: number;
  user: {
    id: number;
    fullName: string;
    username: string;
    phoneNumber: string;
    identityNumber: string;
    address: string;
    maTinh: string;
    maHuyen: string;
    maXa: string;
    createDate?: string;
  };
}

let activeSession: UserSession | null = null;

// Helper to make HTTPS requests
function postJson(urlStr: string, body: any, headers: Record<string, string> = {}): Promise<{ status: number; data: any }> {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const postData = JSON.stringify(body);

    const options: https.RequestOptions = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
        ...headers
      },
      timeout: 15000
    };

    const req = https.request(options, (res) => {
      let rawData = '';
      res.on('data', (chunk) => (rawData += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(rawData);
          resolve({ status: res.statusCode || 200, data: parsed });
        } catch {
          resolve({ status: res.statusCode || 200, data: rawData });
        }
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Yêu cầu đến cổng iLIS VNPT quá thời gian chờ (Timeout)'));
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.write(postData);
    req.end();
  });
}

// Function to authenticate with VNPT iLIS Gateway
async function authenticateUser(username = currentCredentials.username, password = currentCredentials.password): Promise<UserSession> {
  const result = await postJson('https://ilis-gateway-c2.vnpt.vn/portal/users/authenticate', {
    username,
    password
  });

  if (result.status !== 200 || !result.data?.jwtToken) {
    const errorMsg = typeof result.data === 'string' ? result.data : result.data?.message || 'Không thể đăng nhập vào iLIS VNPT';
    throw new Error(errorMsg);
  }

  const { jwtToken, id, fullName, phoneNumber, identityNumber, address, maTinh, maHuyen, maXa, createDate } = result.data;

  // Compute expiration time (15 mins from token or JWT payload)
  let expiresAt = Date.now() + 14 * 60 * 1000;
  try {
    const payloadPart = jwtToken.split('.')[1];
    if (payloadPart) {
      const decoded = JSON.parse(Buffer.from(payloadPart, 'base64').toString());
      if (decoded.exp) {
        expiresAt = decoded.exp * 1000;
      }
    }
  } catch (e) {
    console.error('Failed to parse JWT exp:', e);
  }

  activeSession = {
    jwtToken,
    expiresAt,
    user: {
      id,
      fullName: fullName || 'Huỳnh Hải Đăng',
      username,
      phoneNumber: phoneNumber || '0907704429',
      identityNumber: identityNumber || '096090011798',
      address: address || 'Số 842/2, Ấp Giồng Nhãn A',
      maTinh: maTinh || '95', // Bạc Liêu
      maHuyen: maHuyen || '954',
      maXa: maXa || '31840',
      createDate
    }
  };

  return activeSession;
}

// Ensure valid session token is ready
async function getValidToken(): Promise<string> {
  if (activeSession && activeSession.jwtToken && Date.now() < activeSession.expiresAt - 30000) {
    return activeSession.jwtToken;
  }
  const session = await authenticateUser();
  return session.jwtToken;
}

// Auto-authenticate on server boot
authenticateUser().catch((err) => {
  console.warn('Initial iLIS auto-login notice:', err.message);
});

// API Routes

// 1. Session check & auto-bypass login
app.get('/api/auth/session', async (_req: Request, res: Response) => {
  try {
    if (!activeSession || Date.now() >= activeSession.expiresAt - 30000) {
      await authenticateUser();
    }
    res.json({
      success: true,
      authenticated: true,
      user: activeSession?.user,
      expiresAt: activeSession?.expiresAt,
      serverTime: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      authenticated: false,
      error: error.message || 'Lỗi kết nối phiên làm việc iLIS'
    });
  }
});

// 2. Refresh/reconnect session
app.post('/api/auth/reconnect', async (_req: Request, res: Response) => {
  try {
    const session = await authenticateUser();
    res.json({
      success: true,
      user: session.user,
      message: 'Kết nối lại iLIS thành công'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Kết nối lại thất bại'
    });
  }
});

// 3. Update or switch user credentials
app.post('/api/auth/switch-user', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Thiếu thông tin tài khoản hoặc mật khẩu' });
    }
    const session = await authenticateUser(username, password);
    currentCredentials = { username, password };
    res.json({
      success: true,
      user: session.user,
      message: `Đã chuyển đổi sang tài khoản ${username}`
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message || 'Đăng nhập không thành công với thông tin mới'
    });
  }
});

// 4. Primary GCN lookup endpoint
app.post('/api/tracuu/gcn', async (req: Request, res: Response) => {
  try {
    const { maQr } = req.body;
    if (!maQr || typeof maQr !== 'string' || !maQr.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Mã tra cứu không được để trống!'
      });
    }

    const cleanMaQr = maQr.trim();
    const token = await getValidToken();

    const response = await postJson(
      'https://ilis-gateway-c2.vnpt.vn/portal/GetPresignUrl/get-presign',
      { maQr: cleanMaQr },
      { Authorization: `Bearer ${token}` }
    );

    // Check if VNPT responded with success
    if (response.data && response.data.status === true && response.data.data) {
      return res.json({
        success: true,
        status: true,
        data: response.data.data, // Presigned PDF url
        maQr: cleanMaQr,
        timestamp: new Date().toISOString()
      });
    }

    // Check for standard business message like "Mã QR không còn hiệu lực hoặc không tìm thấy thông tin Giấy chứng nhận trong hệ thống!"
    if (response.data && response.data.status === false) {
      return res.json({
        success: false,
        status: false,
        message: response.data.data || 'Mã QR không còn hiệu lực hoặc không tìm thấy thông tin Giấy chứng nhận trong hệ thống!',
        maQr: cleanMaQr
      });
    }

    // Index error or malformed QR format
    if (response.status === 400 && response.data?.message?.includes('Index was outside the bounds of the array')) {
      return res.status(200).json({
        success: false,
        status: false,
        message: 'Định dạng mã QR không khớp cấu trúc phân tách của iLIS VNPT (Mã chuẩn gồm các trường ngăn cách bởi ký tự |). Vui lòng quét mã QR trực tiếp từ Giấy chứng nhận.',
        maQr: cleanMaQr
      });
    }

    return res.status(200).json({
      success: false,
      status: false,
      message: response.data?.message || response.data?.data || 'Không thể tra cứu thông tin GCN với mã đã cung cấp.',
      maQr: cleanMaQr
    });
  } catch (error: any) {
    console.error('Lookup error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Lỗi hệ thống khi tra cứu Giấy chứng nhận'
    });
  }
});

// 5. Proxy PDF stream if needed
app.get('/api/proxy-file', (req: Request, res: Response) => {
  const fileUrl = req.query.url as string;
  if (!fileUrl) {
    return res.status(400).send('Missing url');
  }

  try {
    https.get(fileUrl, (fileRes) => {
      res.setHeader('Content-Type', fileRes.headers['content-type'] || 'application/pdf');
      res.setHeader('Content-Disposition', 'inline; filename="GiayChungNhan.pdf"');
      fileRes.pipe(res);
    }).on('error', (err) => {
      res.status(500).send('Error streaming file: ' + err.message);
    });
  } catch (e: any) {
    res.status(500).send(e.message);
  }
});

// Setup Vite or static serving
async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT} (mode: ${isProduction ? 'prod' : 'dev'})`);
  });
}

startServer();

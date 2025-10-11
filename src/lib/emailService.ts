import nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'
import type SMTPTransport from 'nodemailer/lib/smtp-transport'

/**
 * Email gönderme servisi
 * Gmail SMTP kullanarak email gönderir
 */

// Email transporter oluştur
const createTransporter = (): Transporter<SMTPTransport.SentMessageInfo> => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER, // Gmail adresiniz
      pass: process.env.EMAIL_PASSWORD, // Gmail App Password
    },
  })
}

/**
 * 6 haneli rastgele doğrulama kodu oluştur
 */
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

/**
 * Doğrulama kodu email'i gönder
 */
export async function sendVerificationEmail(
  to: string,
  code: string,
  name?: string
): Promise<boolean> {
  try {
    const transporter = createTransporter()

    const mailOptions = {
      from: `"Chef2.0 Platform" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: '🔐 Chef2.0 - Email Doğrulama Kodunuz',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              background-color: #f4f4f4;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 40px auto;
              background: #ffffff;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
              background: linear-gradient(135deg, #ea580c 0%, #f97316 100%);
              padding: 40px 20px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              color: #ffffff;
              font-size: 28px;
              font-weight: 700;
            }
            .content {
              padding: 40px 30px;
            }
            .greeting {
              font-size: 18px;
              margin-bottom: 20px;
              color: #1f2937;
            }
            .message {
              font-size: 16px;
              color: #4b5563;
              margin-bottom: 30px;
            }
            .code-container {
              background: #f9fafb;
              border: 2px dashed #d1d5db;
              border-radius: 8px;
              padding: 30px;
              text-align: center;
              margin: 30px 0;
            }
            .code {
              font-size: 42px;
              font-weight: 700;
              color: #ea580c;
              letter-spacing: 8px;
              font-family: 'Courier New', monospace;
            }
            .code-label {
              font-size: 14px;
              color: #6b7280;
              margin-top: 10px;
            }
            .expiry {
              background: #fef3c7;
              border-left: 4px solid #f59e0b;
              padding: 12px 16px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .expiry-text {
              color: #92400e;
              font-size: 14px;
              margin: 0;
            }
            .footer {
              background: #f9fafb;
              padding: 30px;
              text-align: center;
              border-top: 1px solid #e5e7eb;
            }
            .footer-text {
              font-size: 14px;
              color: #6b7280;
              margin: 5px 0;
            }
            .warning {
              background: #fef2f2;
              border-left: 4px solid #ef4444;
              padding: 12px 16px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .warning-text {
              color: #991b1b;
              font-size: 14px;
              margin: 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🍳 Chef2.0</h1>
            </div>
            <div class="content">
              <div class="greeting">
                Merhaba ${name || 'Chef'}! 👋
              </div>
              <div class="message">
                Chef2.0 platformuna hoş geldiniz! Hesabınızı aktif etmek için aşağıdaki 6 haneli doğrulama kodunu kullanın:
              </div>
              
              <div class="code-container">
                <div class="code">${code}</div>
                <div class="code-label">Doğrulama Kodunuz</div>
              </div>
              
              <div class="expiry">
                <p class="expiry-text">
                  ⏰ Bu kod <strong>10 dakika</strong> süreyle geçerlidir.
                </p>
              </div>
              
              <div class="message">
                Kodu doğrulama sayfasına girerek hesabınızı aktif edebilir ve gastronomi dünyasına adım atabilirsiniz.
              </div>
              
              <div class="warning">
                <p class="warning-text">
                  ⚠️ Eğer bu işlemi siz yapmadıysanız, bu e-postayı görmezden gelebilirsiniz.
                  Güvenliğiniz için kodu kimseyle paylaşmayın.
                </p>
              </div>
            </div>
            <div class="footer">
              <p class="footer-text">
                <strong>Chef2.0 Gastronomi Platformu</strong>
              </p>
              <p class="footer-text">
                Profesyonel şeflerden gastronomi öğrenin
              </p>
              <p class="footer-text" style="margin-top: 15px; font-size: 12px;">
                © ${new Date().getFullYear()} Chef2.0. Tüm hakları saklıdır.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    }

    await transporter.sendMail(mailOptions)
    console.log(`Verification email sent to ${to}`)
    return true
  } catch (error) {
    console.error('Error sending verification email:', error)
    return false
  }
}

/**
 * Şifre sıfırlama emaili gönder
 */
export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string,
  name?: string
): Promise<boolean> {
  try {
    const transporter = createTransporter()

    const mailOptions = {
      from: `"Chef2.0 Platform" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: '🔑 Chef2.0 - Şifre Sıfırlama',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
            .header { background: linear-gradient(135deg, #ea580c 0%, #f97316 100%); padding: 40px 20px; text-align: center; }
            .header h1 { margin: 0; color: #ffffff; font-size: 28px; }
            .content { padding: 40px 30px; }
            .button { display: inline-block; background: #ea580c; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
            .button:hover { background: #c2410c; }
            .footer { background: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
            .warning { background: #fef2f2; border-left: 4px solid #ef4444; padding: 12px 16px; margin: 20px 0; border-radius: 4px; color: #991b1b; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🍳 Chef2.0</h1>
            </div>
            <div class="content">
              <h2>Merhaba ${name || 'Chef'}! 👋</h2>
              <p>Şifre sıfırlama talebiniz alındı. Yeni şifre belirlemek için aşağıdaki butona tıklayın:</p>
              
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Şifremi Sıfırla</a>
              </div>
              
              <p style="color: #6b7280; font-size: 14px;">
                Veya bu linki kopyalayıp tarayıcınıza yapıştırın:<br>
                <code style="background: #f3f4f6; padding: 8px; display: block; margin-top: 8px; word-break: break-all;">${resetUrl}</code>
              </p>
              
              <div class="warning">
                ⚠️ <strong>Önemli:</strong> Bu bağlantı 1 saat süreyle geçerlidir.<br>
                Eğer bu işlemi siz yapmadıysanız, bu e-postayı görmezden gelebilirsiniz.
              </div>
            </div>
            <div class="footer">
              <p><strong>Chef2.0 Gastronomi Platformu</strong></p>
              <p>© ${new Date().getFullYear()} Chef2.0. Tüm hakları saklıdır.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    }

    await transporter.sendMail(mailOptions)
    console.log(`Password reset email sent to ${to}`)
    return true
  } catch (error) {
    console.error('Error sending password reset email:', error)
    return false
  }
}

/**
 * Kodun geçerlilik süresini kontrol et (10 dakika)
 */
export function isCodeExpired(expiryDate: Date): boolean {
  return new Date() > expiryDate
}

/**
 * Kod geçerlilik süresi oluştur (10 dakika sonra)
 */
export function getCodeExpiry(): Date {
  const expiry = new Date()
  expiry.setMinutes(expiry.getMinutes() + 10) // 10 dakika
  return expiry
}


/**
 * Email Configuration Test Script
 * 
 * Usage: 
 *   cd apps/api
 *   pnpm tsx scripts/test-email.ts
 * 
 * This script tests SMTP connectivity and sends a test email.
 */

import { config } from '../src/config/env.js';
import nodemailer from 'nodemailer';

async function testEmailConfiguration(): Promise<void> {
  console.log('='.repeat(60));
  console.log('EMAIL CONFIGURATION TEST');
  console.log('='.repeat(60));
  
  // Display current configuration (mask password)
  console.log('\n[1] Current Email Configuration:');
  console.log('-'.repeat(40));
  console.log(`  MAIL_HOST:        ${config.mail.host || '(not set)'}`);
  console.log(`  MAIL_PORT:        ${config.mail.port}`);
  console.log(`  MAIL_SECURE:      ${config.mail.secure}`);
  console.log(`  MAIL_USER:        ${config.mail.user || '(not set)'}`);
  console.log(`  MAIL_PASS:        ${config.mail.pass ? '***' + config.mail.pass.slice(-4) : '(not set)'}`);
  console.log(`  MAIL_FROM_NAME:   ${config.mail.fromName}`);
  console.log(`  MAIL_FROM_EMAIL:  ${config.mail.fromEmail}`);
  console.log(`  MAIL_INTERNAL_TO: ${config.mail.internalTo}`);
  console.log(`  MAIL_REJECT_UNAUTHORIZED: ${config.mail.rejectUnauthorized}`);
  console.log(`  CUSTOMER_CONFIRM: ${config.app.customerConfirmEnabled}`);
  
  // Check for missing required values
  console.log('\n[2] Configuration Validation:');
  console.log('-'.repeat(40));
  
  const issues: string[] = [];
  
  if (!config.mail.host) {
    issues.push('MAIL_HOST is not configured');
  }
  if (!config.mail.fromEmail) {
    issues.push('MAIL_FROM_EMAIL is not configured');
  }
  if (!config.mail.internalTo) {
    issues.push('MAIL_INTERNAL_TO is not configured');
  }
  if (!config.mail.user || !config.mail.pass) {
    issues.push('MAIL_USER or MAIL_PASS not set (authentication may fail)');
  }
  
  if (issues.length > 0) {
    console.log('  Issues found:');
    issues.forEach(issue => console.log(`    - ${issue}`));
  } else {
    console.log('  All required configuration present');
  }
  
  // Create transporter
  console.log('\n[3] Creating SMTP Transporter:');
  console.log('-'.repeat(40));
  
  const hasAuth = !!(config.mail.user && config.mail.pass);
  console.log(`  Authentication: ${hasAuth ? 'Enabled' : 'Disabled'}`);
  
  const transporter = nodemailer.createTransport({
    host: config.mail.host,
    port: config.mail.port,
    secure: config.mail.secure,
    auth: hasAuth ? {
      user: config.mail.user,
      pass: config.mail.pass,
    } : undefined,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 30000,
    tls: {
      rejectUnauthorized: config.mail.rejectUnauthorized,
    },
  });
  
  // Verify connection
  console.log('\n[4] Testing SMTP Connection:');
  console.log('-'.repeat(40));
  console.log(`  Connecting to ${config.mail.host}:${config.mail.port}...`);
  
  try {
    await transporter.verify();
    console.log('  SUCCESS: SMTP connection verified');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.log(`  FAILED: ${errorMessage}`);
    console.log('\n  Possible causes:');
    console.log('    - Incorrect MAIL_HOST or MAIL_PORT');
    console.log('    - Invalid MAIL_USER or MAIL_PASS credentials');
    console.log('    - Firewall blocking outbound SMTP');
    console.log('    - MAIL_SECURE should be true for port 465, false for 587');
    console.log('    - Server requires specific authentication method');
    
    transporter.close();
    process.exit(1);
  }
  
  // Send test email
  console.log('\n[5] Sending Test Email:');
  console.log('-'.repeat(40));
  console.log(`  From: "${config.mail.fromName}" <${config.mail.fromEmail}>`);
  console.log(`  To:   ${config.mail.internalTo}`);
  
  try {
    const result = await transporter.sendMail({
      from: `"${config.mail.fromName}" <${config.mail.fromEmail}>`,
      to: config.mail.internalTo,
      subject: '[TEST] Email Configuration Test - Modular House',
      text: `This is a test email sent at ${new Date().toISOString()}\n\nIf you received this, your email configuration is working correctly.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c5282;">Email Configuration Test</h2>
          <p>This is a test email sent at <strong>${new Date().toISOString()}</strong></p>
          <p style="color: #38a169;">If you received this, your email configuration is working correctly.</p>
          <hr style="border: 1px solid #e2e8f0; margin: 20px 0;">
          <p style="font-size: 12px; color: #718096;">
            Sent from: ${config.mail.fromEmail}<br>
            Host: ${config.mail.host}:${config.mail.port}
          </p>
        </div>
      `,
    });
    
    console.log(`  SUCCESS: Email sent`);
    console.log(`  Message ID: ${result.messageId}`);
    console.log(`  Response: ${result.response}`);
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.log(`  FAILED: ${errorMessage}`);
    
    if (errorMessage.includes('Invalid login') || errorMessage.includes('authentication')) {
      console.log('\n  Authentication error - check MAIL_USER and MAIL_PASS');
    } else if (errorMessage.includes('rejected') || errorMessage.includes('relay')) {
      console.log('\n  The mail server rejected the message. Possible causes:');
      console.log('    - MAIL_FROM_EMAIL domain not authorized');
      console.log('    - SPF/DKIM not configured for sending domain');
      console.log('    - Relay access denied');
    }
  }
  
  transporter.close();
  
  console.log('\n' + '='.repeat(60));
  console.log('TEST COMPLETE');
  console.log('='.repeat(60));
}

// Run the test
testEmailConfiguration().catch(console.error);

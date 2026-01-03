#!/usr/bin/env node
/**
 * EcoWisely Frontend Pre-Flight Check System
 * ==========================================
 *
 * This script validates all frontend system requirements before running the application.
 * It checks environment variables, dependencies, backend connectivity, port availability,
 * and build status.
 *
 * Usage:
 *   node preflight-check.js              # Run all checks
 *   node preflight-check.js --verbose    # Detailed output
 *   node preflight-check.js --skip-backend  # Skip backend connectivity test
 *
 * Exit Codes:
 *   0 - All checks passed
 *   1 - Critical failure(s) detected
 */

const fs = require('fs');
const path = require('path');
const net = require('net');
const { execSync } = require('child_process');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

// Parse command line arguments
const args = process.argv.slice(2);
const verbose = args.includes('--verbose') || args.includes('-v');
const skipBackend = args.includes('--skip-backend');

// Results storage
const results = [];
const issues = [];
const warnings = [];
const actions = [];

// Log file
const LOG_FILE = 'preflight-frontend.log';
let logContent = '';

/**
 * Log message to file and optionally console
 */
function log(message, toConsole = false) {
  const timestamp = new Date().toISOString();
  logContent += `${timestamp} - ${message}\n`;
  if (toConsole && verbose) {
    console.log(`  ${colors.cyan}→${colors.reset} ${message}`);
  }
}

/**
 * Print with color
 */
function print(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Print bright text
 */
function printBright(message, color = 'white') {
  console.log(`${colors.bright}${colors[color]}${message}${colors.reset}`);
}

/**
 * Add a check result
 */
function addResult(name, status, message, details = null) {
  results.push({ name, status, message, details });
  log(`${name}: ${status} - ${message}`);
  
  if (status === 'fail') {
    issues.push(`${name}: ${message}`);
  } else if (status === 'warn') {
    warnings.push(`${name}: ${message}`);
  }
}

/**
 * Get status icon
 */
function getIcon(status) {
  switch (status) {
    case 'pass':
      return `${colors.green}✅${colors.reset}`;
    case 'warn':
      return `${colors.yellow}⚠️ ${colors.reset}`;
    case 'fail':
      return `${colors.red}❌${colors.reset}`;
    default:
      return '  ';
  }
}

// =========================================================================
// CHECK 1: ENVIRONMENT VARIABLES
// =========================================================================

function checkEnvironmentVariables() {
  print(`\n${colors.cyan}Checking Environment Variables...${colors.reset}`);
  
  const envFiles = ['.env.local', '.env'];
  let envFile = null;
  let envVars = {};
  
  // Find and parse env file
  for (const file of envFiles) {
    const envPath = path.join(process.cwd(), file);
    if (fs.existsSync(envPath)) {
      envFile = file;
      const content = fs.readFileSync(envPath, 'utf-8');
      content.split('\n').forEach(line => {
        const match = line.match(/^([^#=]+)=(.*)$/);
        if (match) {
          envVars[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
        }
      });
      break;
    }
  }
  
  if (!envFile) {
    addResult('Environment File', 'fail', '.env.local not found');
    actions.push('Create .env.local file (copy from .env.example)');
    return false;
  }
  
  log(`Found environment file: ${envFile}`, true);
  addResult('Environment File', 'pass', `${envFile} found`);
  
  // Required variables
  const required = [
    'NEXT_PUBLIC_BACKEND_URL',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ];
  
  // Optional variables
  const optional = [
    'NEXT_PUBLIC_SENTRY_DSN',
    'NEXT_PUBLIC_MIXPANEL_TOKEN',
    'NEXT_PUBLIC_GA_TRACKING_ID',
  ];
  
  let allPass = true;
  
  // Check required
  for (const varName of required) {
    const value = envVars[varName] || process.env[varName];
    
    if (!value) {
      addResult(varName, 'fail', 'Not set');
      actions.push(`Set ${varName} in .env.local`);
      allPass = false;
    } else if (isPlaceholder(value)) {
      addResult(varName, 'fail', 'Contains placeholder text');
      actions.push(`Replace placeholder in ${varName}`);
      allPass = false;
    } else {
      log(`${varName}: Set (${value.slice(0, 10)}...)`, true);
      addResult(varName, 'pass', 'Configured');
    }
  }
  
  // Check optional
  for (const varName of optional) {
    const value = envVars[varName] || process.env[varName];
    if (!value) {
      addResult(varName, 'warn', 'Not configured (optional)');
    } else {
      addResult(varName, 'pass', 'Configured');
    }
  }
  
  return allPass;
}

function isPlaceholder(value) {
  const placeholders = [
    'your_', 'your-', 'xxx', 'placeholder', 'enter_', 
    'changeme', 'REPLACE', 'INSERT', 'example'
  ];
  const valueLower = value.toLowerCase();
  return placeholders.some(p => valueLower.includes(p)) || value === '';
}

// =========================================================================
// CHECK 2: DEPENDENCIES
// =========================================================================

function checkDependencies() {
  print(`\n${colors.cyan}Checking Dependencies...${colors.reset}`);
  
  // Check node_modules exists
  const nodeModulesPath = path.join(process.cwd(), 'node_modules');
  if (!fs.existsSync(nodeModulesPath)) {
    addResult('Node Modules', 'fail', 'node_modules not found');
    actions.push('Run: npm install');
    return false;
  }
  
  addResult('Node Modules', 'pass', 'Directory exists');
  
  // Key packages to verify
  const keyPackages = [
    'next',
    'react',
    '@supabase/ssr',
    'recharts',
    'lucide-react',
  ];
  
  const missing = [];
  const found = [];
  
  for (const pkg of keyPackages) {
    const pkgPath = path.join(nodeModulesPath, pkg);
    // Handle scoped packages
    const actualPath = pkg.startsWith('@') 
      ? path.join(nodeModulesPath, ...pkg.split('/'))
      : pkgPath;
    
    if (fs.existsSync(actualPath)) {
      log(`${pkg}: Installed`, true);
      found.push(pkg);
    } else {
      log(`${pkg}: MISSING`, true);
      missing.push(pkg);
    }
  }
  
  if (missing.length > 0) {
    addResult('Key Packages', 'fail', `${missing.length} missing: ${missing.join(', ')}`);
    actions.push(`Run: npm install ${missing.join(' ')}`);
    return false;
  }
  
  addResult('Key Packages', 'pass', `All ${found.length} packages installed`);
  return true;
}

// =========================================================================
// CHECK 3: BACKEND CONNECTION
// =========================================================================

async function checkBackendConnection() {
  if (skipBackend) {
    print(`\n${colors.yellow}Skipping backend connectivity check (--skip-backend)${colors.reset}`);
    return true;
  }
  
  print(`\n${colors.cyan}Checking Backend Connection...${colors.reset}`);
  
  // Get backend URL from env
  let backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  
  // Try to read from .env.local
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
    const match = content.match(/NEXT_PUBLIC_BACKEND_URL=(.+)/);
    if (match) {
      backendUrl = match[1].trim().replace(/^["']|["']$/g, '');
    }
  }
  
  if (!backendUrl) {
    backendUrl = 'http://localhost:8000';
    log('Using default backend URL: http://localhost:8000', true);
  }
  
  log(`Testing backend at: ${backendUrl}`, true);
  
  try {
    const healthUrl = `${backendUrl}/health`;
    
    // Use native fetch (Node 18+) or fallback
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    
    try {
      const response = await fetch(healthUrl, {
        signal: controller.signal,
        method: 'GET',
      });
      clearTimeout(timeout);
      
      if (response.ok) {
        addResult('Backend API', 'pass', `Reachable at ${backendUrl}`);
        return true;
      } else {
        addResult('Backend API', 'fail', `HTTP ${response.status}`);
        actions.push('Ensure backend is running: cd BackEnd && uvicorn main:app');
        return false;
      }
    } catch (fetchError) {
      clearTimeout(timeout);
      throw fetchError;
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      addResult('Backend API', 'fail', 'Connection timeout');
    } else if (error.code === 'ECONNREFUSED') {
      addResult('Backend API', 'fail', 'Connection refused - backend not running');
    } else {
      addResult('Backend API', 'fail', `Error: ${error.message.slice(0, 50)}`);
    }
    actions.push('Start backend: cd ../BackEnd && uvicorn main:app --port 8000');
    return false;
  }
}

// =========================================================================
// CHECK 4: PORT AVAILABILITY
// =========================================================================

function checkPort(port = 3000) {
  return new Promise((resolve) => {
    print(`\n${colors.cyan}Checking Port Availability...${colors.reset}`);
    
    const server = net.createServer();
    
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        addResult(`Port ${port}`, 'fail', 'Already in use');
        actions.push(`Kill process on port ${port}: lsof -ti:${port} | xargs kill -9`);
        resolve(false);
      } else {
        addResult(`Port ${port}`, 'fail', err.message);
        resolve(false);
      }
    });
    
    server.once('listening', () => {
      server.close();
      addResult(`Port ${port}`, 'pass', 'Available');
      resolve(true);
    });
    
    server.listen(port, '0.0.0.0');
  });
}

// =========================================================================
// CHECK 5: BUILD STATUS
// =========================================================================

function checkBuildStatus() {
  print(`\n${colors.cyan}Checking Build Status...${colors.reset}`);
  
  const nextDir = path.join(process.cwd(), '.next');
  
  if (!fs.existsSync(nextDir)) {
    addResult('Build', 'warn', 'No build found (will build on start)');
    return true; // Not critical
  }
  
  // Check if build is recent (within 24 hours)
  try {
    const stats = fs.statSync(nextDir);
    const buildAge = Date.now() - stats.mtimeMs;
    const hoursOld = Math.floor(buildAge / (1000 * 60 * 60));
    
    if (hoursOld > 24) {
      addResult('Build', 'warn', `Build is ${hoursOld} hours old`);
    } else {
      addResult('Build', 'pass', `Build found (${hoursOld}h old)`);
    }
  } catch (error) {
    addResult('Build', 'pass', 'Build directory exists');
  }
  
  return true;
}

// =========================================================================
// CHECK 6: SUPABASE ACCESSIBILITY (Optional)
// =========================================================================

async function checkSupabaseConnection() {
  print(`\n${colors.cyan}Checking Supabase Accessibility...${colors.reset}`);
  
  // Get Supabase URL from env
  let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  
  // Try to read from .env.local
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
    const match = content.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/);
    if (match) {
      supabaseUrl = match[1].trim().replace(/^["']|["']$/g, '');
    }
  }
  
  if (!supabaseUrl) {
    addResult('Supabase', 'warn', 'URL not configured');
    return true;
  }
  
  log(`Testing Supabase at: ${supabaseUrl}`, true);
  
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      signal: controller.signal,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    clearTimeout(timeout);
    
    // Supabase returns 400 without proper auth, but that means it's reachable
    if (response.ok || response.status === 400 || response.status === 401) {
      addResult('Supabase', 'pass', 'Accessible');
      return true;
    } else {
      addResult('Supabase', 'warn', `HTTP ${response.status}`);
      return true;
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      addResult('Supabase', 'warn', 'Connection timeout');
    } else {
      addResult('Supabase', 'warn', `Not reachable: ${error.message.slice(0, 30)}`);
    }
    return true; // Not critical
  }
}

// =========================================================================
// PRINT SUMMARY
// =========================================================================

function printSummary(allPass) {
  printBright(`\n═══════════════════════════════════════════`, 'cyan');
  printBright(`📋 SUMMARY`, 'cyan');
  printBright(`═══════════════════════════════════════════`, 'cyan');
  
  // Group results by category
  const categories = {
    'ENVIRONMENT': [
      'Environment File', 'NEXT_PUBLIC_BACKEND_URL', 'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'NEXT_PUBLIC_SENTRY_DSN',
      'NEXT_PUBLIC_MIXPANEL_TOKEN', 'NEXT_PUBLIC_GA_TRACKING_ID'
    ],
    'DEPENDENCIES': ['Node Modules', 'Key Packages'],
    'CONNECTIVITY': ['Backend API', 'Supabase'],
    'SYSTEM': ['Port 3000', 'Build'],
  };
  
  for (const [category, items] of Object.entries(categories)) {
    const categoryResults = results.filter(r => items.includes(r.name));
    if (categoryResults.length === 0) continue;
    
    printBright(`\n${category}:`, 'white');
    for (const result of categoryResults) {
      console.log(`  ${getIcon(result.status)} ${result.name}: ${result.message}`);
    }
  }
  
  printBright(`\n═══════════════════════════════════════════`, 'cyan');
  
  if (allPass && issues.length === 0) {
    printBright(`✅ ALL CHECKS PASSED - READY TO LAUNCH! 🚀`, 'green');
    printBright(`═══════════════════════════════════════════`, 'cyan');
    print(`\nStart frontend: npm run dev`, 'white');
  } else {
    printBright(`❌ PRE-FLIGHT CHECK FAILED`, 'red');
    printBright(`═══════════════════════════════════════════`, 'cyan');
    
    if (issues.length > 0) {
      printBright(`\nISSUES FOUND:`, 'red');
      for (const issue of issues) {
        console.log(`  ${colors.red}❌${colors.reset} ${issue}`);
      }
    }
    
    if (warnings.length > 0) {
      printBright(`\nWARNINGS:`, 'yellow');
      for (const warning of warnings) {
        console.log(`  ${colors.yellow}⚠️ ${colors.reset} ${warning}`);
      }
    }
    
    if (actions.length > 0) {
      printBright(`\nREQUIRED ACTIONS:`, 'white');
      actions.forEach((action, i) => {
        console.log(`  ${i + 1}. ${action}`);
      });
    }
    
    printBright(`\n═══════════════════════════════════════════`, 'cyan');
    printBright(`🛑 CANNOT START - FIX ISSUES ABOVE`, 'red');
    printBright(`═══════════════════════════════════════════`, 'cyan');
  }
  
  print(`\nLog saved to: ${LOG_FILE}\n`, 'white');
}

// =========================================================================
// MAIN ENTRY POINT
// =========================================================================

async function main() {
  printBright(`\n═══════════════════════════════════════════`, 'green');
  printBright(`🎨 ECOWISELY FRONTEND - PRE-FLIGHT CHECK`, 'green');
  printBright(`═══════════════════════════════════════════`, 'green');
  
  // Run all checks
  const envPass = checkEnvironmentVariables();
  const depsPass = checkDependencies();
  const backendPass = await checkBackendConnection();
  const supabasePass = await checkSupabaseConnection();
  const portPass = await checkPort(3000);
  const buildPass = checkBuildStatus();
  
  // Determine overall status
  const criticalPass = envPass && depsPass;
  const allPass = criticalPass && backendPass;
  
  // Print summary
  printSummary(allPass);
  
  // Save log file
  fs.writeFileSync(LOG_FILE, logContent);
  
  // Exit with appropriate code
  process.exit(criticalPass ? 0 : 1);
}

// Run main function
main().catch((error) => {
  console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
  process.exit(1);
});

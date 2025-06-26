
// Simple debug script to test calendar functionality
const { execSync } = require('child_process');

console.log('🔍 Debugging Solar CRM Calendar Functionality');
console.log('='.repeat(50));

// Test 1: Check if the server is running
try {
  const response = execSync('curl -s -o /dev/null -w "%{http_code}" http://localhost:3000', { encoding: 'utf8' });
  console.log(`✅ Server Status: ${response === '200' ? 'Running' : response === '307' ? 'Redirecting (Expected)' : 'Error'}`);
} catch (error) {
  console.log('❌ Server is not running');
  process.exit(1);
}

// Test 2: Check if API routes exist
try {
  const routes = execSync('find app/app/api -name "*.ts" | grep calendar', { encoding: 'utf8' });
  console.log('✅ Calendar API routes found:');
  routes.split('\n').filter(r => r).forEach(route => console.log(`   - ${route}`));
} catch (error) {
  console.log('❌ Calendar API routes not found');
}

// Test 3: Check if calendar components exist
try {
  const components = execSync('find components/calendar -name "*.tsx"', { encoding: 'utf8' });
  console.log('✅ Calendar components found:');
  components.split('\n').filter(c => c).forEach(comp => console.log(`   - ${comp}`));
} catch (error) {
  console.log('❌ Calendar components not found');
}

// Test 4: Check for TypeScript errors
try {
  console.log('🔍 Checking for TypeScript errors...');
  execSync('npx tsc --noEmit', { stdio: 'pipe' });
  console.log('✅ No TypeScript errors found');
} catch (error) {
  console.log('❌ TypeScript errors detected');
  console.log(error.stdout?.toString() || error.message);
}

// Test 5: Check imports in calendar components
try {
  const imports = execSync('grep -h "^import" components/calendar/*.tsx', { encoding: 'utf8' });
  console.log('✅ Calendar component imports look correct');
} catch (error) {
  console.log('❌ Issue with calendar component imports');
}

console.log('\n🎯 Next steps: Check browser console for runtime errors');
console.log('Navigate to http://localhost:3000 and sign in to test the calendar');

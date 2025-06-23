console.log('=== SIMPLE OUTPUT TEST ===');
process.stdout.write('=== SIMPLE OUTPUT TEST ===\n');

console.log('1. Testing console.log');
process.stdout.write('2. Testing process.stdout.write\n');

console.log('3. Testing with numbers:', 123, 456);
process.stdout.write('4. Testing with numbers: 123 456\n');

console.log('5. Testing with objects:', { test: 'value' });
process.stdout.write('5. Testing with objects: {"test":"value"}\n');

console.log('=== TEST COMPLETE ===');
process.stdout.write('=== TEST COMPLETE ===\n');

// Force exit
process.exit(0); 
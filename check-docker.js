const { exec } = require('child_process');

function checkDocker() {
  console.log('🔍 Checking Docker installation...\n');
  
  exec('docker --version', (error, stdout, stderr) => {
    if (error) {
      console.log('❌ Docker is not installed or not in PATH');
      console.log('   Please install Docker Desktop from: https://www.docker.com/products/docker-desktop/');
      console.log('   After installation, restart your terminal and run this script again.');
      return;
    }
    
    console.log('✅ Docker is installed!');
    console.log('   Version:', stdout.trim());
    
    // Check if Docker daemon is running
    exec('docker ps', (error, stdout, stderr) => {
      if (error) {
        console.log('\n❌ Docker daemon is not running');
        console.log('   Please start Docker Desktop and try again.');
        return;
      }
      
      console.log('\n✅ Docker daemon is running!');
      console.log('   Docker is ready to execute code.');
      
      // Test a simple Docker command
      exec('docker run --rm hello-world', (error, stdout, stderr) => {
        if (error) {
          console.log('\n⚠️  Docker test failed, but Docker is running');
          console.log('   This is normal for the first run.');
        } else {
          console.log('\n🎉 Docker is working perfectly!');
          console.log('   You can now test compiler errors in the UI.');
        }
        
        console.log('\n🚀 Next steps:');
        console.log('   1. Start the frontend: cd client && npm start');
        console.log('   2. Go to a problem page in your browser');
        console.log('   3. Enter code with syntax errors');
        console.log('   4. Click "Test Code" to see compiler errors!');
      });
    });
  });
}

checkDocker(); 
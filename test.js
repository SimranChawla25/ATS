const { Builder, By } = require('selenium-webdriver');
const sleep = require('util').promisify(setTimeout)

async function runTest() {
  const capabilities = {
    'bstack:options': {
      'buildName': 'media-test-build',
      userName: process.env.BROWSERSTACK_USERNAME,
      accessKey: process.env.BROWSERSTACK_ACCESS_KEY,
      interactiveDebugging: true,
      headless: false,
      video: true,
      resolution: "1366x768"
    },
    browserName: 'chrome',
    browserVersion: 'latest',
  };

    // Initialize the WebDriver
    driver = new Builder()
      .usingServer(
        'https://<hub>/wd/hub',
      )
      .withCapabilities(capabilities)
      .build();

    try {
        // Navigate to the local test webpage
        await driver.get('https://mic-test.com/');
        
        // Inject JavaScript to create an RTP media stream
        let jsCode = `
            function _showMessage(str) {
                const span = document.getElementById('message_span');
                if (span) {
                    span.innerText = str;
                }
            }
            function _startAudioStream() {

                return new Promise((resolve, reject) => {
                    fetch('https://ae44-205-254-171-209.ngrok-free.app/public/audios/sample.wav', {
                        mode: 'cors',
                        credentials: 'omit'
                    })
                        .then(response => {
                          return response.blob()
                        })
                        .then(blob => {
                            const audio = new Audio(URL.createObjectURL(blob));
                            const ctx = new (window.AudioContext || window.webkitAudioContext)();
                            const stream_dest = ctx.createMediaStreamDestination();
                            const source = ctx.createMediaElementSource(audio);
                            source.connect(stream_dest);
                            const stream = stream_dest.stream;
                            audio.play();
                            resolve(stream);
                        });
                });
            }
            function _modifiedGetUserMedia(constraints) {
                const withAudio = !(!constraints.audio);

                return _startAudioStream().catch((err) => {
                    return navigator.mediaDevices._getUserMedia(constraints);
                });
            }
            MediaDevices.prototype.getUserMedia = _modifiedGetUserMedia;
        `;

        // Execute the JavaScript in the browser
        await driver.executeScript(jsCode);
        console.log('done')

        const startMicTest = await driver.findElement(By.css('#hero > div:nth-child(3) > button'))
        await startMicTest.click()
        console.log('start mic clicked')
        await sleep(5000)
        const startRecordingTest = await await driver.findElement(By.css('#mictester > div.mic-recorder-container.MuiBox-root.css-0 > div > div.MuiGrid-root.MuiGrid-container.MuiGrid-spacing-xs-2.mic-recording-container.css-isbt42 > div.MuiGrid-root.MuiGrid-item.MuiGrid-grid-xs-12.MuiGrid-grid-md-7.css-1ak9ift > div.css-1rnkjon > div > button'))
        await startRecordingTest.click()
        console.log('record started')
        await sleep(10000)
        const stopRecordingTest = await await driver.findElement(By.css('#mictester > div.mic-recorder-container.MuiBox-root.css-0 > div > div > div.MuiGrid-root.MuiGrid-item.MuiGrid-grid-xs-12.MuiGrid-grid-md-7.css-1ak9ift > div.css-1rnkjon > div > button'))
        await stopRecordingTest.click()
        console.log('record stopped')
        await sleep(5000)

    } catch(e) {
      console.log(`Caught : ${e.message} : ${e.stack}`)
    } finally {
        // Clean up
        await driver.quit();
    }
}

runTest().catch(console.error);
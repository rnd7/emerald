const {app, BrowserWindow, ipcMain} = require('electron')
const path = require('path')
const url = require('url')

let controls
let output

function createControls() {
  controls = new BrowserWindow({width: 800, height: 600})
  controls.loadURL(url.format({
    pathname: path.join(__dirname, 'gui/controls.html'),
    protocol: 'file:',
    slashes: true
  }))
  controls.setMenu(null)
  //controls.webContents.openDevTools()
  controls.on('closed', () => {
    controls = null
  })
}

ipcMain.on('output', (event, method, ...params)=> {
  if(output) output.webContents.send(method, ...params)
})

ipcMain.on('fullscreenOutput', (event) => {
  if(output) output.setFullScreen(true)
})

ipcMain.on('windowOutput', (event) => {
  if(output) output.setFullScreen(false)
})

function createOutput() {
  output = new BrowserWindow({width: 800, height: 600, titleBarStyle: 'hidden', fullscreenable: true})
  output.loadURL(url.format({
    pathname: path.join(__dirname, 'gui/output.html'),
    protocol: 'file:',
    slashes: true
  }))
  output.setMenu(null)
  //output.webContents.openDevTools()
  output.on('closed', () => {
    output = null
  })
}

function onReady() {
  createControls()
  createOutput()
}

app.on('ready', onReady)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (controls === null) {
    createControls()
  }
  if (output === null) {
    createOutput()
  }
})

import { Button } from './components/ui/button'

function App(): React.JSX.Element {
  const ipcHandle = (): void => window.electron.ipcRenderer.send('ping')

  return (
    <>
     <Button onClick={ipcHandle}>Click me</Button>
    </>
  )
}

export default App

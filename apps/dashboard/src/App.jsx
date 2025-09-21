import './App.css'
import Pages from "@/pages/index.jsx"
import ToastProvider from "@/components/ui/ToastProvider"

function App() {
  return (
    <ToastProvider>
      <Pages />
    </ToastProvider>
  )
}

export default App 
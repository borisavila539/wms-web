import './App.css';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './Screens/Login/Login';
import {  WMSProvider } from './Context/WMSContext';
import { Navigation } from './Navigation/Navigation';

function App() {
  return (
    <WMSProvider>
      <Router>
        <Routes>
          <Route path='/' element={<Login />} />
          <Route path='/Login' element={<Login />} />
          <Route path='/Menu/*' element={<Navigation />} />
        </Routes>
      </Router>
    </WMSProvider>

  );
}

export default App;

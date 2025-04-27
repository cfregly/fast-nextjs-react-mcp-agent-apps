import { Routes, Route } from 'react-router-dom';

import Header from './components/Header';
import AsciiTravel from './components/AsciiTravel';
import Weather from './components/Weather';

function App() {
  const logoText = "ASCII Travel"; 

  return (
    <div>
      <Header logoText={logoText} />
      <Routes>
        <Route path="/" element={<AsciiTravel />} />
        <Route path="/get-weather" element={<Weather />} />
        <Route path="*" element={<AsciiTravel />} />
      </Routes>
    </div>
  );
}

export default App;
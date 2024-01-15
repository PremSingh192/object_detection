
import { BrowserRouter, Link, Route, Routes,  } from 'react-router-dom';

import Home from './screens/Home';
import Login from './screens/Login';
function App() {
  return (
    <>
    <BrowserRouter><Routes>
    <Route path="/" element={<Home/>}></Route>
    <Route path="/login" element={<Login/>}></Route>
    </Routes>

    </BrowserRouter>
    </>
  );
}

export default App;

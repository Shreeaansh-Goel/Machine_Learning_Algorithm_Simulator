import { BrowserRouter, Route, Routes } from "react-router-dom";
import Layout from "./components/layout/Layout.jsx";
import Home from "./pages/Home.jsx";
import Visualizer from "./pages/Visualizer.jsx";
import ComparePage from "./pages/ComparePage.jsx";
import QuizPage from "./pages/QuizPage.jsx";

/**
 * Root application component.
 * @returns {JSX.Element}
 */
export const App = () => (
  <BrowserRouter>
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/visualize" element={<Visualizer />} />
        <Route path="/visualize/:algorithm" element={<Visualizer />} />
        <Route path="/compare" element={<ComparePage />} />
        <Route path="/quiz" element={<QuizPage />} />
      </Routes>
    </Layout>
  </BrowserRouter>
);

export default App;

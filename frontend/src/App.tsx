import Header from './components/Header';
import Map from './components/Map';
import Sidebar from './components/Sidebar';

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-120px)]">
          {/* Sidebar */}
          <div className="lg:col-span-1 overflow-y-auto">
            <Sidebar />
          </div>

          {/* Map Area */}
          <div className="lg:col-span-3">
            <Map />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;

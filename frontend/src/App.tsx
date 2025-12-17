import Header from './components/Header';
import MapboxMap from './components/MapboxMap';
import Sidebar from './components/Sidebar';
import CitySnapshot from './components/analytics/CitySnapshot';
import InteractionTimeline from './components/analytics/InteractionTimeline';
import TrendingTopics from './components/analytics/TrendingTopics';
import TopKeywords from './components/analytics/TopKeywords';

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1 overflow-y-auto max-h-[calc(100vh-120px)]">
            <Sidebar />
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3 space-y-6">
            {/* City Snapshot - Volume and Sentiment Analysis */}
            <CitySnapshot />

            {/* Trending Topics Cards */}
            <TrendingTopics />

            {/* Map and Timeline Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Map */}
              <div className="h-[400px]">
                <MapboxMap />
              </div>

              {/* Interaction Timeline */}
              <div>
                <InteractionTimeline />
              </div>
            </div>

            {/* Keywords Widget */}
            <TopKeywords />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;

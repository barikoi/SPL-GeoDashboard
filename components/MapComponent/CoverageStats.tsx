import React from 'react';

interface CoverageStatsProps {
  showCoverageStats: boolean;
  coverageStats: Array<{
    provinceName: string;
    totalArea: number;
    coveredArea: number;
    coveragePercentage: number;
    timeLimit: number;
  }>;
  suggestedHubStats: Array<{
    provinceName: string;
    totalArea: number;
    coveredArea: number;
    coveragePercentage: number;
    hubCount: number;
    timestamp: number;
  }>;
  suggestedHubsIsochronesStats: Array<{
    provinceName: string;
    totalArea: number;
    coveredArea: number;
    coveragePercentage: number;
    hubCount: number;
    timestamp: number;
  }>;
  suggestedHubs: any[];
  suggestedHubsIsochrones: any[];
  onClose: () => void;
}

const CoverageStats: React.FC<CoverageStatsProps> = ({
  showCoverageStats,
  coverageStats,
  suggestedHubStats,
  suggestedHubsIsochronesStats,
  suggestedHubs,
  suggestedHubsIsochrones,
  onClose
}) => {
  if (!showCoverageStats) return null;

  // Sort the stats by time limit
  const sortedStats = coverageStats;
  
  // Get suggested hub stats
  const sortedSuggestedStats = suggestedHubStats;
  
  // Get isochrone stats from the dedicated state
  const isochroneStats = suggestedHubsIsochronesStats;
  
  return (
    <div className="absolute right-10 top-[153px] bg-white/90 p-4 rounded-lg shadow-lg z-[1000] max-h-[60vh] overflow-auto">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold text-lg">Coverage Statistics</h3>
        <button 
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 ml-2"
        >
          ×
        </button>
      </div>
      
      {/* Current Hub Coverage Stats */}
      {sortedStats.length > 0 && (
        <>
          <h4 className="font-semibold text-md mb-2">Current Hub Coverage</h4>
          <table className="w-[500px] text-sm border mb-4">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-3 border-r">Region</th>
                <th className="text-right py-2 px-3 border-r">Time (min)</th>
                <th className="text-right py-2 px-3 border-r">Area (km²)</th>
                <th className="text-right py-2 px-3 border-r">Coverage (km²)</th>
                <th className="text-right py-2 px-3">Coverage %</th>
              </tr>
            </thead>
            <tbody>
              {sortedStats.map((stat, index) => (
                <tr key={index} className={index === sortedStats.length - 1 ? "border-b font-bold bg-gray-100" : "border-b"}>
                  <td className="py-2 px-3 border-r">{stat.provinceName}</td>
                  <td className="text-right py-2 px-3 border-r">{stat.timeLimit}</td>
                  <td className="text-right py-2 px-3 border-r">
                    {(stat.totalArea / 1000000).toFixed(2)}
                  </td>
                  <td className="text-right py-2 px-3 border-r">
                    {(stat.coveredArea / 1000000).toFixed(2)}
                  </td>
                  <td className="text-right py-2 px-3">
                    {stat.coveragePercentage.toFixed(2)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
      
      {/* Suggested Hub Coverage Stats */}
      {sortedSuggestedStats.length > 0 && suggestedHubs && suggestedHubs.length > 0 && (
        <>
          <h4 className="font-semibold text-md mb-2">Suggested Hub Coverage</h4>
          <table className="w-[500px] text-sm border mb-4">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-3 border-r">Region</th>
                <th className="text-right py-2 px-3 border-r">Hubs</th>
                <th className="text-right py-2 px-3 border-r">Area (km²)</th>
                <th className="text-right py-2 px-3 border-r">Coverage (km²)</th>
                <th className="text-right py-2 px-3">Coverage %</th>
              </tr>
            </thead>
            <tbody>
              {sortedSuggestedStats.map((stat, index) => (
                <tr 
                  key={index} 
                  className={index === sortedSuggestedStats.length - 1 ? "border-b font-bold bg-green-50" : "border-b"}
                >
                  <td className="py-2 px-3 border-r">{stat.provinceName}</td>
                  <td className="text-right py-2 px-3 border-r">{stat.hubCount}</td>
                  <td className="text-right py-2 px-3 border-r">
                    {(stat.totalArea / 1000000).toFixed(2)}
                  </td>
                  <td className="text-right py-2 px-3 border-r">
                    {(stat.coveredArea / 1000000).toFixed(2)}
                  </td>
                  <td className="text-right py-2 px-3">
                    {stat.coveragePercentage.toFixed(2)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
      
      {/* Coverage with Walking Distance Stats */}
      {isochroneStats.length > 0 && suggestedHubsIsochrones && suggestedHubsIsochrones.length > 0 && (
        <>
          <h4 className="font-semibold text-md mb-2">Coverage with Walking Distance</h4>
          <table className="w-[500px] text-sm border mb-4">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-3 border-r">Region</th>
                <th className="text-right py-2 px-3 border-r">Hubs</th>
                <th className="text-right py-2 px-3 border-r">Area (km²)</th>
                <th className="text-right py-2 px-3 border-r">Coverage (km²)</th>
                <th className="text-right py-2 px-3">Coverage %</th>
              </tr>
            </thead>
            <tbody>
              {isochroneStats.map((stat, index) => (
                <tr 
                  key={index} 
                  className={index === isochroneStats.length - 1 ? "border-b font-bold bg-orange-50" : "border-b"}
                >
                  <td className="py-2 px-3 border-r">{stat.provinceName}</td>
                  <td className="text-right py-2 px-3 border-r">{stat.hubCount}</td>
                  <td className="text-right py-2 px-3 border-r">
                    {(stat.totalArea / 1000000).toFixed(2)}
                  </td>
                  <td className="text-right py-2 px-3 border-r">
                    {(stat.coveredArea / 1000000).toFixed(2)}
                  </td>
                  <td className="text-right py-2 px-3">
                    {stat.coveragePercentage.toFixed(2)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
      
      {/* Comparison section */}
      {sortedStats.length > 0 && (sortedSuggestedStats.length > 0 || isochroneStats.length > 0) && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <h4 className="font-semibold text-md mb-2">Coverage Comparison</h4>
          
          {sortedSuggestedStats.length > 0 && (
            <p className="text-sm mb-2">
              <span className="font-medium">Suggested Hubs Improvement: </span>
              {(sortedSuggestedStats[sortedSuggestedStats.length - 1].coveragePercentage - 
                sortedStats[sortedStats.length - 1].coveragePercentage).toFixed(2)}% 
              {sortedSuggestedStats[sortedSuggestedStats.length - 1].coveragePercentage > 
                sortedStats[sortedStats.length - 1].coveragePercentage 
                ? " increase" 
                : " decrease"} in coverage
            </p>
          )}
          
          {isochroneStats.length > 0 && (
              <p className="text-sm">
                <span className="font-medium">Walking Distance Improvement: </span>
                {(isochroneStats[isochroneStats.length - 1].coveragePercentage - 
                  sortedStats[sortedStats.length - 1].coveragePercentage).toFixed(2)}% 
                {isochroneStats[isochroneStats.length - 1].coveragePercentage > 
                  sortedStats[sortedStats.length - 1].coveragePercentage 
                  ? " increase" 
                  : " decrease"} in coverage
              </p>
            )}
          </div>
        )}
      </div>
  )
}

export default CoverageStats;
"use client";
import { Cloud, CloudRain, Sun, Wind, ChevronLeft, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const weatherData = [
  {
    date: "Friday, Nov 15",
    high: 68,
    low: 52,
    condition: "Sunny",
    icon: Sun,
    gradient: "from-amber-400 to-orange-500",
    description: "Perfect weather for outdoor activities!",
  },
  {
    date: "Saturday, Nov 16",
    high: 65,
    low: 48,
    condition: "Partly Cloudy",
    icon: Cloud,
    gradient: "from-blue-400 to-indigo-500",
    description: "Great day for hiking with some cloud cover",
  },
  {
    date: "Sunday, Nov 17",
    high: 58,
    low: 45,
    condition: "Light Rain",
    icon: CloudRain,
    gradient: "from-slate-400 to-slate-600",
    description: "Bring rain gear for morning activities",
  },
];

export function WeatherForecast() {
  const [currentDay, setCurrentDay] = useState(0);
  const weather = weatherData[currentDay];
  const WeatherIcon = weather.icon;

  return (
    <Card className="p-6 shadow-soft transition-smooth hover:shadow-medium overflow-hidden">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Wind className="h-6 w-6 text-primary" />
        Weather Forecast
      </h2>
      <div className="relative">
        <div className={`rounded-xl p-6 bg-gradient-to-br ${weather.gradient} text-white shadow-strong`}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-lg font-semibold opacity-90">{weather.date}</p>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-5xl font-bold">{weather.high}°</span>
                <span className="text-2xl opacity-75">/ {weather.low}°</span>
              </div>
            </div>
            <WeatherIcon className="h-16 w-16 opacity-90" />
          </div>
          <div className="space-y-2">
            <p className="text-xl font-semibold">{weather.condition}</p>
            <p className="opacity-90">{weather.description}</p>
          </div>
        </div>
        {weatherData.length > 1 && (
          <div className="flex items-center justify-between mt-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentDay(Math.max(0, currentDay - 1))}
              disabled={currentDay === 0}
              className="rounded-full"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex gap-2">
              {weatherData.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentDay(index)}
                  className={`h-2 rounded-full transition-smooth ${
                    index === currentDay ? "w-8 bg-primary" : "w-2 bg-muted"
                  }`}
                />
              ))}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentDay(Math.min(weatherData.length - 1, currentDay + 1))}
              disabled={currentDay === weatherData.length - 1}
              className="rounded-full"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
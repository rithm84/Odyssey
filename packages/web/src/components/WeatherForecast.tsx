"use client";
import { Cloud, CloudRain, Sun, Wind, ChevronLeft, ChevronRight, Thermometer } from "lucide-react";
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
    gradient: "from-orange-400 via-amber-400 to-yellow-500 dark:from-orange-500 dark:via-amber-500 dark:to-yellow-600",
    description: "Perfect weather for outdoor activities!",
  },
  {
    date: "Saturday, Nov 16",
    high: 65,
    low: 48,
    condition: "Partly Cloudy",
    icon: Cloud,
    gradient: "from-sky-400 via-blue-400 to-indigo-500 dark:from-sky-500 dark:via-blue-600 dark:to-indigo-700",
    description: "Great day for hiking with some cloud cover",
  },
  {
    date: "Sunday, Nov 17",
    high: 58,
    low: 45,
    condition: "Light Rain",
    icon: CloudRain,
    gradient: "from-slate-500 via-gray-500 to-blue-600 dark:from-slate-700 dark:via-gray-700 dark:to-blue-800",
    description: "Bring rain gear for morning activities",
  },
];

export function WeatherForecast() {
  const [currentDay, setCurrentDay] = useState(0);
  const weather = weatherData[currentDay];
  const WeatherIcon = weather.icon;

  return (
    <Card className="p-6 shadow-soft transition-all duration-500 hover:shadow-glow-red border-border/60 backdrop-blur-sm bg-card/80 group relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative z-10">
        <h2 className="text-3xl font-black tracking-tight flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center shadow-medium">
            <Wind className="h-5 w-5 text-white" />
          </div>
          <span>Weather Forecast</span>
        </h2>

        <div className="relative">
          <div className={`relative rounded-2xl p-8 bg-gradient-to-br ${weather.gradient} text-white shadow-strong overflow-hidden group/weather`}>
            <div className="absolute inset-0 hero-grid" />

            <div className="relative z-10">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <p className="text-white/80 text-sm font-bold uppercase tracking-wide mb-2">
                    {weather.date}
                  </p>
                  <div className="flex items-baseline gap-3">
                    <span className="text-6xl font-black tracking-tight">{weather.high}°</span>
                    <div className="flex items-center gap-1 text-white/70">
                      <span className="text-3xl font-bold">/ {weather.low}°</span>
                    </div>
                  </div>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 animate-float">
                  <WeatherIcon className="h-16 w-16" />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Thermometer className="h-5 w-5 text-white/80" />
                  <p className="text-2xl font-black">{weather.condition}</p>
                </div>
                <p className="text-white/90 text-lg leading-relaxed">{weather.description}</p>
              </div>
            </div>
          </div>

          {weatherData.length > 1 && (
            <div className="flex items-center justify-between mt-6">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentDay(Math.max(0, currentDay - 1))}
                disabled={currentDay === 0}
                className="rounded-xl h-10 w-10 border-border/60 hover:border-primary hover:bg-primary hover:text-white transition-all"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>

              <div className="flex gap-2">
                {weatherData.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentDay(index)}
                    className={`h-2.5 rounded-full transition-all duration-300 ${
                      index === currentDay
                        ? "w-10 gradient-primary shadow-medium"
                        : "w-2.5 bg-muted hover:bg-primary/30"
                    }`}
                  />
                ))}
              </div>

              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentDay(Math.min(weatherData.length - 1, currentDay + 1))}
                disabled={currentDay === weatherData.length - 1}
                className="rounded-xl h-10 w-10 border-border/60 hover:border-primary hover:bg-primary hover:text-white transition-all"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

'use client';

import { useContext } from 'react';
import { ArrowLeft, Cloud, CloudDrizzle, CloudFog, CloudLightning, CloudRain, CloudSnow, Sun } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { AppContext } from '@/context/app-context';

interface FakeWeatherProps {
  onTriggerPin: () => void;
}

const dailyForecast = [
    { day: "Mon", Icon: Sun, temp: "72°" },
    { day: "Tue", Icon: Cloud, temp: "68°" },
    { day: "Wed", Icon: CloudRain, temp: "65°" },
    { day: "Thu", Icon: Sun, temp: "75°" },
    { day: "Fri", Icon: CloudDrizzle, temp: "69°" },
];

export function FakeWeather({ onTriggerPin }: FakeWeatherProps) {
  const context = useContext(AppContext);

  if (!context) return null;
  const { t } = context;
  
  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-blue-300 to-blue-500 text-white">
      <header className="flex items-center justify-between p-4">
        <Button variant="ghost" size="icon" onClick={onTriggerPin} className="hover:bg-white/20">
          <ArrowLeft />
        </Button>
        <h1 className="font-headline text-xl font-bold">{t.discreet.weatherTitle}</h1>
        <div className="w-10"></div>
      </header>
      <main className="flex flex-1 flex-col items-center justify-center p-4 text-center">
        <h2 className="text-2xl font-semibold">New York</h2>
        <Sun className="my-4 h-32 w-32" />
        <p className="text-7xl font-bold">72°</p>
        <p className="text-xl text-white/80">Sunny</p>
        <div className="mt-8 flex w-full justify-around rounded-lg bg-white/20 p-4 backdrop-blur-sm">
            {dailyForecast.map(({day, Icon, temp}) => (
                <div key={day} className="flex flex-col items-center gap-2">
                    <p className="font-semibold">{day}</p>
                    <Icon className="h-8 w-8" />
                    <p>{temp}</p>
                </div>
            ))}
        </div>
      </main>
    </div>
  );
}

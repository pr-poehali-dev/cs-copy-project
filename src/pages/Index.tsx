import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import Icon from '@/components/ui/icon';

interface Weapon {
  name: string;
  damage: number;
  recoil: number;
  fireRate: number;
  ammo: number;
  maxAmmo: number;
}

interface Player {
  x: number;
  y: number;
  angle: number;
  health: number;
  maxHealth: number;
}

interface Enemy {
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  id: number;
}

const weapons: Weapon[] = [
  { name: 'AK-47', damage: 36, recoil: 8, fireRate: 600, ammo: 30, maxAmmo: 30 },
  { name: 'M4A4', damage: 33, recoil: 5, fireRate: 666, ammo: 30, maxAmmo: 30 },
  { name: 'AWP', damage: 115, recoil: 12, fireRate: 41, ammo: 10, maxAmmo: 10 },
  { name: 'Glock-18', damage: 28, recoil: 3, fireRate: 400, ammo: 20, maxAmmo: 20 }
];

const Index = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [player, setPlayer] = useState<Player>({ x: 400, y: 300, angle: 0, health: 100, maxHealth: 100 });
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [currentWeapon, setCurrentWeapon] = useState(0);
  const [gameStats, setGameStats] = useState({ kills: 0, score: 0, round: 1 });
  const [isGameRunning, setIsGameRunning] = useState(false);
  const mousePos = useRef({ x: 0, y: 0 });
  const keys = useRef({ w: false, a: false, s: false, d: false });

  // Initialize enemies
  useEffect(() => {
    const initialEnemies: Enemy[] = [];
    for (let i = 0; i < 3; i++) {
      initialEnemies.push({
        id: i,
        x: Math.random() * 700 + 50,
        y: Math.random() * 500 + 50,
        health: 100,
        maxHealth: 100
      });
    }
    setEnemies(initialEnemies);
  }, []);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case 'w': keys.current.w = true; break;
        case 'a': keys.current.a = true; break;
        case 's': keys.current.s = true; break;
        case 'd': keys.current.d = true; break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case 'w': keys.current.w = false; break;
        case 'a': keys.current.a = false; break;
        case 's': keys.current.s = false; break;
        case 'd': keys.current.d = false; break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Handle mouse movement for aiming
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    mousePos.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
    
    // Calculate angle from player to mouse
    const dx = mousePos.current.x - player.x;
    const dy = mousePos.current.y - player.y;
    const angle = Math.atan2(dy, dx);
    
    setPlayer(prev => ({ ...prev, angle }));
  }, [player.x, player.y]);

  // Handle shooting
  const handleShoot = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isGameRunning) return;
    
    const weapon = weapons[currentWeapon];
    if (weapon.ammo <= 0) return;

    // Update weapon ammo
    weapons[currentWeapon].ammo--;
    
    // Simple hit detection (check if mouse is near any enemy)
    const hitDistance = 50;
    const updatedEnemies = enemies.map(enemy => {
      const distance = Math.sqrt(
        Math.pow(mousePos.current.x - enemy.x, 2) + 
        Math.pow(mousePos.current.y - enemy.y, 2)
      );
      
      if (distance < hitDistance) {
        const newHealth = enemy.health - weapon.damage;
        if (newHealth <= 0) {
          setGameStats(prev => ({ ...prev, kills: prev.kills + 1, score: prev.score + 100 }));
          return null; // Mark for removal
        }
        return { ...enemy, health: newHealth };
      }
      return enemy;
    }).filter(enemy => enemy !== null) as Enemy[];
    
    setEnemies(updatedEnemies);
    
    // Add recoil effect
    const recoilOffset = (weapon.recoil * Math.random() - weapon.recoil / 2) * 0.02;
    setPlayer(prev => ({ ...prev, angle: prev.angle + recoilOffset }));
  }, [isGameRunning, currentWeapon, enemies]);

  // Game loop
  useEffect(() => {
    if (!isGameRunning) return;

    const gameLoop = () => {
      // Update player position based on keys
      setPlayer(prev => {
        let newX = prev.x;
        let newY = prev.y;
        const speed = 3;

        if (keys.current.w) newY -= speed;
        if (keys.current.s) newY += speed;
        if (keys.current.a) newX -= speed;
        if (keys.current.d) newX += speed;

        // Keep player within bounds
        newX = Math.max(20, Math.min(780, newX));
        newY = Math.max(20, Math.min(580, newY));

        return { ...prev, x: newX, y: newY };
      });

      animationRef.current = requestAnimationFrame(gameLoop);
    };

    animationRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isGameRunning]);

  // Canvas drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      // Clear canvas
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw grid pattern (game world)
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1;
      for (let i = 0; i < canvas.width; i += 50) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
      }
      for (let i = 0; i < canvas.height; i += 50) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
        ctx.stroke();
      }

      // Draw enemies
      enemies.forEach(enemy => {
        // Enemy body
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(enemy.x - 15, enemy.y - 15, 30, 30);
        
        // Enemy health bar
        ctx.fillStyle = '#333';
        ctx.fillRect(enemy.x - 20, enemy.y - 25, 40, 6);
        ctx.fillStyle = '#00ff00';
        const healthPercent = enemy.health / enemy.maxHealth;
        ctx.fillRect(enemy.x - 20, enemy.y - 25, 40 * healthPercent, 6);
      });

      // Draw player
      ctx.save();
      ctx.translate(player.x, player.y);
      ctx.rotate(player.angle);
      
      // Player body
      ctx.fillStyle = '#00d4ff';
      ctx.fillRect(-12, -12, 24, 24);
      
      // Weapon direction indicator
      ctx.strokeStyle = '#ff6b35';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(30, 0);
      ctx.stroke();
      
      ctx.restore();

      // Draw crosshair at mouse position
      if (isGameRunning) {
        ctx.strokeStyle = '#ff6b35';
        ctx.lineWidth = 2;
        const crosshairSize = 15;
        
        ctx.beginPath();
        ctx.moveTo(mousePos.current.x - crosshairSize, mousePos.current.y);
        ctx.lineTo(mousePos.current.x + crosshairSize, mousePos.current.y);
        ctx.moveTo(mousePos.current.x, mousePos.current.y - crosshairSize);
        ctx.lineTo(mousePos.current.x, mousePos.current.y + crosshairSize);
        ctx.stroke();
      }

      requestAnimationFrame(draw);
    };

    draw();
  }, [player, enemies, isGameRunning]);

  const startGame = () => {
    setIsGameRunning(true);
  };

  const reloadWeapon = () => {
    const weapon = weapons[currentWeapon];
    weapon.ammo = weapon.maxAmmo;
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4">
      {/* Game Title */}
      <div className="text-center mb-4">
        <h1 className="text-4xl font-bold text-primary mb-2">COUNTER-STRIKE CLONE</h1>
        <p className="text-muted-foreground">WASD для движения • Мышь для прицеливания • ЛКМ для стрельбы</p>
      </div>

      <div className="flex gap-4 max-w-7xl mx-auto">
        {/* Game Canvas */}
        <div className="flex-1">
          <Card className="p-4 relative">
            <canvas
              ref={canvasRef}
              width={800}
              height={600}
              className="border border-border rounded cursor-crosshair"
              onMouseMove={handleMouseMove}
              onClick={handleShoot}
              style={{ background: 'hsl(var(--game-dark))' }}
            />
            
            {!isGameRunning && (
              <div className="absolute inset-4 flex items-center justify-center bg-black/80 rounded">
                <Button onClick={startGame} size="lg" className="text-xl px-8 py-4">
                  <Icon name="Play" className="mr-2" />
                  НАЧАТЬ ИГРУ
                </Button>
              </div>
            )}
          </Card>
        </div>

        {/* Game HUD */}
        <div className="w-80 space-y-4">
          {/* Player Stats */}
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <Icon name="User" className="mr-2" />
              Статистика игрока
            </h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Здоровье</span>
                  <span>{player.health}/{player.maxHealth}</span>
                </div>
                <Progress value={(player.health / player.maxHealth) * 100} className="h-2" />
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-2xl font-bold text-primary">{gameStats.kills}</div>
                  <div className="text-xs text-muted-foreground">Убийства</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-secondary">{gameStats.score}</div>
                  <div className="text-xs text-muted-foreground">Очки</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{gameStats.round}</div>
                  <div className="text-xs text-muted-foreground">Раунд</div>
                </div>
              </div>
            </div>
          </Card>

          {/* Weapon System */}
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <Icon name="Zap" className="mr-2" />
              Оружие
            </h3>
            <div className="space-y-3">
              {/* Current Weapon */}
              <div className="bg-muted rounded p-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-primary">{weapons[currentWeapon].name}</span>
                  <span className="text-sm">
                    {weapons[currentWeapon].ammo}/{weapons[currentWeapon].maxAmmo}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <div className="text-muted-foreground">Урон</div>
                    <div className="font-semibold">{weapons[currentWeapon].damage}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Отдача</div>
                    <div className="font-semibold">{weapons[currentWeapon].recoil}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Скорострел.</div>
                    <div className="font-semibold">{weapons[currentWeapon].fireRate}</div>
                  </div>
                </div>
                <Button onClick={reloadWeapon} className="w-full mt-2" variant="secondary" size="sm">
                  <Icon name="RotateCcw" className="mr-1 w-3 h-3" />
                  Перезарядить
                </Button>
              </div>

              {/* Weapon Selection */}
              <div className="grid grid-cols-2 gap-2">
                {weapons.map((weapon, index) => (
                  <Button
                    key={weapon.name}
                    variant={currentWeapon === index ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentWeapon(index)}
                    className="text-xs"
                  >
                    {weapon.name}
                  </Button>
                ))}
              </div>
            </div>
          </Card>

          {/* Minimap */}
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <Icon name="Map" className="mr-2" />
              Мини-карта
            </h3>
            <div className="relative w-full h-32 bg-muted rounded border">
              {/* Player dot */}
              <div 
                className="absolute w-2 h-2 bg-primary rounded-full"
                style={{
                  left: `${(player.x / 800) * 100}%`,
                  top: `${(player.y / 600) * 100}%`,
                  transform: 'translate(-50%, -50%)'
                }}
              />
              {/* Enemy dots */}
              {enemies.map(enemy => (
                <div
                  key={enemy.id}
                  className="absolute w-2 h-2 bg-destructive rounded-full"
                  style={{
                    left: `${(enemy.x / 800) * 100}%`,
                    top: `${(enemy.y / 600) * 100}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                />
              ))}
            </div>
          </Card>

          {/* Controls Help */}
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <Icon name="Info" className="mr-2" />
              Управление
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Движение:</span>
                <span className="font-mono">WASD</span>
              </div>
              <div className="flex justify-between">
                <span>Прицеливание:</span>
                <span className="font-mono">Мышь</span>
              </div>
              <div className="flex justify-between">
                <span>Стрельба:</span>
                <span className="font-mono">ЛКМ</span>
              </div>
              <div className="flex justify-between">
                <span>Перезарядка:</span>
                <span className="font-mono">R</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
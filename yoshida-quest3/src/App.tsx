/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sword, Shield, Sparkles, LogOut, Heart, Zap } from 'lucide-react';
import battleBgm from './battle_bgm.mp3';
import titleBgm from './title_bgm.mp3';
import gameoverBgm from './gameover_bgm.mp3';
import victoryBgm from './victory_bgm.mp3';
import clickSound from './click.mp3';
import attackSound from './attack.mp3';
import specialSound from './special.mp3';
import missSound from './miss.mp3';
import healSound from './heal.mp3';
import damageSound from './damage.mp3';
import runSound from './run.mp3';
import bossImg from './input_file_0.png';
import bossDialogue from './boss_dialogue.png';

// --- Types ---
type Entity = {
  name: string;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  attack: number;
  defense: number;
  speed: number;
  sprite: string;
};

type GameState = 'LOADING' | 'NAME_ENTRY' | 'DIALOGUE' | 'START' | 'PLAYER_TURN' | 'ENEMY_TURN' | 'VICTORY' | 'DEFEAT' | 'ANIMATING' | 'POST_BATTLE_DIALOGUE' | 'CLEAR' | 'CLOSED';
type MenuType = 'MAIN' | 'SKILL';

// --- Constants ---
const BGM_URL = battleBgm; 
const CLICK_SOUND_URL = clickSound;
const ATTACK_SOUND_URL = attackSound;
const SPECIAL_SOUND_URL = specialSound;
const MISS_SOUND_URL = missSound;
const HEAL_SOUND_URL = healSound;
const DAMAGE_SOUND_URL = damageSound;
const RUN_SOUND_URL = runSound;
const PLAYER_BASE: Entity = {
  name: '勇者',
  hp: 1000,
  maxHp: 1000,
  mp: 100,
  maxMp: 100,
  attack: 1000, // Base for calculation
  defense: 0,
  speed: 15,
  sprite: '👤',
};

const BOSS: Entity = { 
  name: '大魔王ヨシダ', 
  hp: 9999, 
  maxHp: 9999, 
  mp: 999, 
  maxMp: 999, 
  attack: 100, // Base for calculation
  defense: 0, 
  speed: 10, 
  sprite: bossImg
};

const BOSS_DIALOGUE_SPRITE = bossDialogue;

export default function App() {
  const [playerName, setPlayerName] = useState('');
  const [player, setPlayer] = useState<Entity>(PLAYER_BASE);
  const [enemy, setEnemy] = useState<Entity>(BOSS);
  const [gameState, setGameState] = useState<GameState>('LOADING');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [messages, setMessages] = useState<string[]>([]);
  const [damageEffect, setDamageEffect] = useState<{ target: 'player' | 'enemy'; amount: number | string } | null>(null);
  const [shake, setShake] = useState<'player' | 'enemy' | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isDefending, setIsDefending] = useState(false);
  const [menuType, setMenuType] = useState<MenuType>('MAIN');
  const [fieldDialogue, setFieldDialogue] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const clickAudioRef = useRef<HTMLAudioElement | null>(null);
  const attackAudioRef = useRef<HTMLAudioElement | null>(null);
  const specialAudioRef = useRef<HTMLAudioElement | null>(null);
  const missAudioRef = useRef<HTMLAudioElement | null>(null);
  const healAudioRef = useRef<HTMLAudioElement | null>(null);
  const damageAudioRef = useRef<HTMLAudioElement | null>(null);
  const runAudioRef = useRef<HTMLAudioElement | null>(null);
  const messageEndRef = useRef<HTMLDivElement>(null);

  // --- Asset Preloading ---
  useEffect(() => {
    // Check if it's April 1st
    const now = new Date();
    const month = now.getMonth() + 1; // getMonth() is 0-indexed
    const day = now.getDate();
    
    if (month !== 4 || day !== 1) {
      setGameState('CLOSED');
      return;
    }

    const assets = [
      { type: 'audio', url: battleBgm },
      { type: 'audio', url: titleBgm },
      { type: 'audio', url: gameoverBgm },
      { type: 'audio', url: victoryBgm },
      { type: 'audio', url: CLICK_SOUND_URL },
      { type: 'audio', url: ATTACK_SOUND_URL },
      { type: 'audio', url: SPECIAL_SOUND_URL },
      { type: 'audio', url: MISS_SOUND_URL },
      { type: 'audio', url: HEAL_SOUND_URL },
      { type: 'audio', url: DAMAGE_SOUND_URL },
      { type: 'audio', url: RUN_SOUND_URL },
      { type: 'image', url: BOSS.sprite },
      { type: 'image', url: BOSS_DIALOGUE_SPRITE },
    ];

    let loadedCount = 0;
    const totalCount = assets.length;

    const updateProgress = () => {
      loadedCount++;
      setLoadingProgress(Math.floor((loadedCount / totalCount) * 100));
      if (loadedCount === totalCount) {
        setTimeout(() => setGameState('NAME_ENTRY'), 500);
      }
    };

    assets.forEach(asset => {
      if (asset.type === 'audio') {
        const audio = new Audio(asset.url);
        audio.addEventListener('canplaythrough', updateProgress, { once: true });
        audio.load();
      } else {
        const img = new Image();
        img.onload = updateProgress;
        img.onerror = updateProgress; // Continue even if image fails
        img.src = asset.url;
      }
    });
  }, []);

  // --- Audio Logic ---
  useEffect(() => {
    if (!clickAudioRef.current) clickAudioRef.current = new Audio(CLICK_SOUND_URL);
    if (!attackAudioRef.current) attackAudioRef.current = new Audio(ATTACK_SOUND_URL);
    if (!specialAudioRef.current) specialAudioRef.current = new Audio(SPECIAL_SOUND_URL);
    if (!missAudioRef.current) missAudioRef.current = new Audio(MISS_SOUND_URL);
    if (!healAudioRef.current) healAudioRef.current = new Audio(HEAL_SOUND_URL);
    if (!damageAudioRef.current) damageAudioRef.current = new Audio(DAMAGE_SOUND_URL);
    if (!runAudioRef.current) runAudioRef.current = new Audio(RUN_SOUND_URL);
  }, []);

  const playSound = (audioRef: React.RefObject<HTMLAudioElement | null>) => {
    if (audioRef.current && !isMuted) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(e => console.error("Sound play failed:", e));
    }
  };

  const playClickSound = () => playSound(clickAudioRef);

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.loop = true;
    }

    let targetBgm = battleBgm;
    if (gameState === 'NAME_ENTRY' || gameState === 'DIALOGUE') {
      targetBgm = titleBgm;
    } else if (gameState === 'DEFEAT') {
      targetBgm = gameoverBgm;
    } else if (gameState === 'CLEAR') {
      targetBgm = victoryBgm;
    }

    // Update src if changed
    const currentSrc = audioRef.current.src;
    if (!currentSrc || !currentSrc.includes(targetBgm.replace('./', ''))) {
      audioRef.current.src = targetBgm;
      audioRef.current.currentTime = 0;
    }

    if (!isMuted && gameState !== 'VICTORY' && gameState !== 'CLEAR') {
      audioRef.current.play().catch(e => console.error("Audio play failed:", e));
    } else {
      audioRef.current.pause();
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [isMuted, gameState]);

  // --- Helpers ---
  const addMessage = (msg: string) => {
    setMessages((prev) => [...prev, msg]);
  };

  const scrollToBottom = () => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // --- Battle Logic ---
  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) return;
    setPlayer({ ...PLAYER_BASE, name: playerName });
    setGameState('DIALOGUE');
  };

  const startBattle = () => {
    setFieldDialogue(null);
    setEnemy({ ...BOSS });
    setPlayer(prev => ({ ...prev, hp: prev.maxHp, mp: prev.maxMp }));
    setMessages([`${BOSS.name}が現れた！`, '心を闇に支配された大魔王ヨシダを討て！']);
    setGameState('PLAYER_TURN');
  };

  const handlePlayerAttack = async () => {
    if (gameState !== 'PLAYER_TURN') return;
    setGameState('ANIMATING');
    setIsDefending(false);
    setMenuType('MAIN');

    addMessage(`${player.name}の攻撃！`);
    
    await new Promise(r => setTimeout(r, 600));
    
    // 900 ~ 1100 damage
    const damage = 900 + Math.floor(Math.random() * 201);
    playSound(attackAudioRef);
    setDamageEffect({ target: 'enemy', amount: damage });
    setShake('enemy');
    
    setEnemy(prev => ({ ...prev, hp: Math.max(0, prev.hp - damage) }));
    addMessage(`${enemy.name}に${damage}のダメージ！`);

    await new Promise(r => setTimeout(r, 800));
    setDamageEffect(null);
    setShake(null);

    if (enemy.hp - damage <= 0) {
      setGameState('POST_BATTLE_DIALOGUE');
      addMessage(`${enemy.name}を倒した！`);
    } else {
      setGameState('ENEMY_TURN');
    }
  };

  const handlePlayerSpecial = async () => {
    if (gameState !== 'PLAYER_TURN') return;
    setGameState('ANIMATING');
    setIsDefending(false);
    setMenuType('MAIN');

    addMessage(`${player.name}の必殺の一撃！`);
    
    await new Promise(r => setTimeout(r, 600));
    
    if (Math.random() < 0.45) {
      addMessage('しかし 攻撃ははずれた！');
      playSound(missAudioRef);
      setDamageEffect({ target: 'enemy', amount: 'MISS' });
    } else {
      // 2x Damage: 1800 ~ 2200
      const damage = (900 + Math.floor(Math.random() * 201)) * 2;
      playSound(specialAudioRef);
      setDamageEffect({ target: 'enemy', amount: damage });
      setShake('enemy');
      
      setEnemy(prev => ({ ...prev, hp: Math.max(0, prev.hp - damage) }));
      addMessage(`${enemy.name}に${damage}のダメージ！`);
      
      if (enemy.hp - damage <= 0) {
        await new Promise(r => setTimeout(r, 800));
        setDamageEffect(null);
        setShake(null);
        setGameState('POST_BATTLE_DIALOGUE');
        addMessage(`${enemy.name}を倒した！`);
        return;
      }
    }

    await new Promise(r => setTimeout(r, 800));
    setDamageEffect(null);
    setShake(null);
    setGameState('ENEMY_TURN');
  };

  const handlePlayerHeal = async () => {
    if (gameState !== 'PLAYER_TURN') return;
    
    const mpCost = 20;
    if (player.mp < mpCost) {
      addMessage('MPが足りない！');
      return;
    }

    setGameState('ANIMATING');
    setIsDefending(false);
    setMenuType('MAIN');

    addMessage(`${player.name}は体力を回復した！`);
    
    await new Promise(r => setTimeout(r, 600));
    
    const healAmount = 150;
    playSound(healAudioRef);
    setPlayer(prev => ({ 
      ...prev, 
      hp: Math.min(prev.maxHp, prev.hp + healAmount),
      mp: prev.mp - mpCost
    }));
    addMessage(`${player.name}の体力が${healAmount}回復した！`);

    await new Promise(r => setTimeout(r, 800));
    setGameState('ENEMY_TURN');
  };

  const handlePlayerDefense = () => {
    if (gameState !== 'PLAYER_TURN') return;
    setIsDefending(true);
    setMenuType('MAIN');
    addMessage(`${player.name}は身を守っている！`);
    setGameState('ENEMY_TURN');
  };

  const handlePlayerRun = async () => {
    if (gameState !== 'PLAYER_TURN') return;
    setGameState('ANIMATING');
    setIsDefending(false);
    setMenuType('MAIN');

    addMessage(`${player.name}は逃げ出そうとした！`);
    playSound(runAudioRef);
    await new Promise(r => setTimeout(r, 800));
    addMessage(`${player.name}はつまづいて転んだ！`);
    await new Promise(r => setTimeout(r, 800));
    addMessage(`${enemy.name}の攻撃！`);
    
    await new Promise(r => setTimeout(r, 600));
    playSound(damageAudioRef);
    setShake('player');
    setPlayer(prev => ({ ...prev, hp: 0 }));
    addMessage(`${player.name}は力尽きた...`);
    
    await new Promise(r => setTimeout(r, 800));
    setShake(null);
    setGameState('DEFEAT');
  };

  const handleEnemyTurn = useCallback(async () => {
    if (gameState !== 'ENEMY_TURN') return;
    setGameState('ANIMATING');

    await new Promise(r => setTimeout(r, 1000));
    
    // Calculate strong attack probability
    // Starts at 3%, increases by 3% for every 1000 HP lost
    const hpLost = BOSS.hp - enemy.hp;
    const strongAttackProb = 0.04 + (Math.floor(hpLost / 1000) * 0.04);
    
    const isStrongAttack = Math.random() < strongAttackProb;
    
    if (isStrongAttack) {
      addMessage(`${enemy.name}の渾身の一撃！`);
    } else {
      addMessage(`${enemy.name}の攻撃！`);
    }
    
    await new Promise(r => setTimeout(r, 600));
    
    const isDodge = Math.random() < 0.05;
    if (isDodge) {
      addMessage(`${player.name}は攻撃をかわした！`);
      playSound(missAudioRef);
      await new Promise(r => setTimeout(r, 800));
      setGameState('PLAYER_TURN');
      return;
    }

    // Normal: 90 ~ 110
    let damage = 90 + Math.floor(Math.random() * 21);
    if (isStrongAttack) damage *= 2;
    
    if (isDefending) {
      damage = Math.floor(damage / 2);
      addMessage(`${player.name}は攻撃を半減させた！`);
    }
    
    playSound(damageAudioRef);
    setDamageEffect({ target: 'player', amount: damage });
    setShake('player');
    
    setPlayer(prev => ({ ...prev, hp: Math.max(0, prev.hp - damage) }));
    addMessage(`${player.name}は${damage}のダメージを受けた！`);

    await new Promise(r => setTimeout(r, 800));
    setDamageEffect(null);
    setShake(null);
    setIsDefending(false);

    if (player.hp - damage <= 0) {
      setGameState('DEFEAT');
      addMessage(`${player.name}は力尽きた...`);
    } else {
      setGameState('PLAYER_TURN');
    }
  }, [enemy, player, gameState, isDefending]);

  useEffect(() => {
    if (gameState === 'ENEMY_TURN') {
      handleEnemyTurn();
    }
  }, [gameState, handleEnemyTurn]);

  // --- UI Components ---
  if (gameState === 'CLOSED') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-black text-white font-retro">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full border-2 border-white/30 p-8 bg-white/5 backdrop-blur-sm space-y-8 text-center"
        >
          <div className="space-y-4">
            <h1 className="text-3xl font-black tracking-widest text-red-500">ACCESS DENIED</h1>
            <div className="h-0.5 bg-white/20 w-full" />
          </div>
          
          <div className="space-y-6">
            <p className="text-sm leading-relaxed">
               <span className="text-yellow-500 font-bold">4月1日</span> 限定です。<br />
            </p>
            <div className="text-[10px] text-gray-500 uppercase tracking-[0.2em]">
              - The gate will open on April 1st -
            </div>
          </div>

          <div className="pt-4">
            <div className="inline-block border border-white/30 px-4 py-2 text-[10px] opacity-50">
              CURRENT DATE: {new Date().toLocaleDateString()}
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  if (gameState === 'LOADING') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-black text-white font-retro">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-full max-w-sm flex flex-col items-center gap-8"
        >
          <div className="text-center space-y-4">
            <h1 className="text-2xl tracking-[0.3em] animate-pulse">LOADING...</h1>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest">Preparing for the Quest</p>
          </div>
          
          <div className="w-full h-4 border-2 border-white p-0.5">
            <motion.div 
              className="h-full bg-white"
              initial={{ width: 0 }}
              animate={{ width: `${loadingProgress}%` }}
            />
          </div>
          
          <div className="text-[10px] font-mono opacity-50">
            {loadingProgress}%
          </div>
        </motion.div>
      </div>
    );
  }

  if (gameState === 'NAME_ENTRY') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-black text-white font-retro overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-red-900 rounded-full animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-blue-900 rounded-full animate-pulse delay-700" />
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-lg z-10 flex flex-col items-center gap-12"
        >
          {/* Main Title */}
          <div className="flex flex-col items-center gap-2">
            <motion.h1 
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="text-3xl sm:text-5xl md:text-7xl font-black tracking-[0.1em] sm:tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-gray-500"
            >
              YOSHIDAN
            </motion.h1>
            <motion.h2 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="text-2xl sm:text-4xl md:text-6xl font-black tracking-[0.2em] sm:tracking-[0.3em] text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-gray-500"
            >
              QUEST
            </motion.h2>
          </div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="w-full max-w-sm border-2 border-white/30 p-8 bg-black/80 backdrop-blur-sm flex flex-col gap-8 shadow-[0_0_50px_rgba(0,0,0,0.5)]"
          >
            <div className="text-center space-y-2">
              <p className="text-[10px] tracking-widest text-gray-400 uppercase">Enter Player Name</p>
              <h3 className="text-sm">導かれし者よ、その名を名乗れ</h3>
            </div>

            <form onSubmit={handleNameSubmit} className="flex flex-col gap-6">
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value.slice(0, 8))}
                    placeholder="なまえ"
                    autoFocus
                    className="w-full bg-transparent border-b-2 border-white/50 p-2 text-center text-2xl focus:outline-none focus:border-white transition-colors placeholder:opacity-20"
                  />
                  <div className="absolute -bottom-0.5 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-white to-transparent opacity-50" />
                </div>
                
                {/* Audio Toggle next to input */}
                <button 
                  type="button"
                  onClick={() => {
                    playClickSound();
                    setIsMuted(!isMuted);
                  }}
                  className="w-10 h-10 flex items-center justify-center border border-white/30 hover:bg-white hover:text-black transition-colors"
                  title={isMuted ? 'SOUND OFF' : 'SOUND ON'}
                >
                  {isMuted ? '🔈' : '🔊'}
                </button>
              </div>
              
              <button 
                type="submit"
                onClick={playClickSound}
                className="group relative p-4 overflow-hidden bg-white text-black transition-all hover:scale-105 active:scale-95"
              >
                <div className="absolute inset-0 bg-gray-200 translate-y-full group-hover:translate-y-0 transition-transform" />
                <span className="relative z-10 text-sm font-bold tracking-widest">冒険を始める</span>
              </button>
            </form>
          </motion.div>

          <motion.p 
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="text-[8px] tracking-[0.5em] text-gray-500 uppercase"
          >
            Press Start to Begin
          </motion.p>
        </motion.div>

        {/* Version Info */}
        <div className="absolute bottom-4 text-[8px] opacity-20 tracking-widest uppercase">
          v1.0.0 - © 2026 YOSHIDA STUDIO
        </div>
      </div>
    );
  }

  if (gameState === 'DIALOGUE') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-black text-white font-retro overflow-hidden">
        {/* Audio Toggle */}
        <button 
          onClick={() => {
            playClickSound();
            setIsMuted(!isMuted);
          }}
          className="absolute top-4 right-4 text-[8px] border border-white/30 px-2 py-1 hover:bg-white hover:text-black transition-colors z-20"
        >
          {isMuted ? '🔈 SOUND OFF' : '🔊 SOUND ON'}
        </button>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-full max-w-2xl flex flex-col items-center gap-8"
        >
          <div className="relative w-full mt-24">
            {/* RPG Dialogue Box */}
            <div className="border-4 border-white bg-black p-8 pt-12 relative min-h-[200px] flex flex-col justify-between">
              {/* Boss Image (Top-Left Overlay) */}
              <div className="absolute -top-20 -left-4 w-32 h-32 border-4 border-white bg-black p-2 shadow-2xl">
                <img 
                  src={BOSS_DIALOGUE_SPRITE} 
                  alt={BOSS.name}
                  className="w-full h-full object-contain"
                  style={{ imageRendering: 'pixelated' }}
                />
              </div>

              <div className="space-y-4">
                <p className="text-red-500 text-xs tracking-widest uppercase opacity-70">{BOSS.name}</p>
                <p className="text-xl md:text-2xl leading-relaxed">
                  「なんだ貴様は？ 我を見て何を笑っている。<br />
                  ここに来たこと後悔させてやるわ！」
                </p>
              </div>

              <div className="flex justify-end mt-8">
                <button 
                  onClick={() => {
                    playClickSound();
                    startBattle();
                  }}
                  className="group relative px-8 py-3 bg-white text-black font-bold text-sm hover:bg-gray-200 transition-all flex items-center gap-2"
                >
                  <span>戦いに挑む</span>
                  <Sword className="w-4 h-4 animate-bounce" />
                </button>
              </div>
            </div>
          </div>

          <motion.p 
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="text-[8px] tracking-[0.5em] text-gray-500 uppercase"
          >
            Click the button to start battle
          </motion.p>
        </motion.div>
      </div>
    );
  }

  if (gameState === 'POST_BATTLE_DIALOGUE') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-black text-white font-retro overflow-hidden">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-full max-w-2xl flex flex-col items-center gap-8"
        >
          <div className="relative w-full mt-24">
            <div className="border-4 border-white bg-black p-8 pt-12 relative min-h-[200px] flex flex-col justify-between">
              <div className="absolute -top-20 -left-4 w-32 h-32 border-4 border-white bg-black p-2 shadow-2xl">
                <img 
                  src={BOSS_DIALOGUE_SPRITE} 
                  alt={BOSS.name}
                  className="w-full h-full object-contain opacity-50 grayscale"
                  style={{ imageRendering: 'pixelated' }}
                />
              </div>

              <div className="space-y-4">
                <p className="text-red-500 text-xs tracking-widest uppercase opacity-70">{BOSS.name}</p>
                <p className="text-xl md:text-2xl leading-relaxed">
                  「バカな... この私が敗れるとは...<br />
                  だが私が得たこの闇の力が消えることはないだろう！<br />
                  ふははははっ...ぐふっ！」
                </p>
              </div>

              <div className="flex justify-end mt-8">
                <button 
                  onClick={() => {
                    playClickSound();
                    setGameState('CLEAR');
                  }}
                  className="group relative px-8 py-3 bg-white text-black font-bold text-sm hover:bg-gray-200 transition-all flex items-center gap-2"
                >
                  <span>次へ</span>
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  if (gameState === 'CLEAR') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-black text-white font-retro overflow-hidden">
        <motion.div 
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-12 text-center"
        >
          <div className="space-y-4">
            <motion.h1 
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="text-3xl sm:text-6xl md:text-8xl font-black text-yellow-500 tracking-normal sm:tracking-widest drop-shadow-[0_0_20px_rgba(234,179,8,0.5)]"
            >
              GAME CLEAR
            </motion.h1>
            <p className="text-2xl font-bold tracking-[0.2em]">おめでとう！</p>
          </div>

          <div className="border-2 border-white/30 p-8 bg-white/5 backdrop-blur-sm space-y-6 max-w-md">
            <p className="text-sm leading-relaxed">
              {player.name} の活躍により、<br />大魔王ヨシダは社会人ヨシダとして働き始めた。<br />
              ヨシダは社会の歯車として束縛され、<br />過酷な日々が訪れるだろう。
            </p>
            <p className="text-xs text-gray-500 tracking-widest italic">
              - 俺は頑張るから君も頑張れ！ -
            </p>
          </div>

          <button 
            onClick={() => {
              playClickSound();
              setGameState('NAME_ENTRY');
              setMessages([]);
            }}
            className="p-4 border-2 border-white hover:bg-white hover:text-black transition-all text-sm font-bold tracking-widest"
          >
            タイトルに戻る
          </button>
        </motion.div>
      </div>
    );
  }

  if (gameState === 'DEFEAT') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-black text-white font-retro overflow-hidden">
        <motion.div 
          initial={{ opacity: 0, scale: 2 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-12"
        >
          <h1 className="text-3xl sm:text-6xl md:text-8xl font-black text-red-600 tracking-tighter animate-pulse">
            GAME OVER
          </h1>
          <div className="text-center space-y-4">
            <p className="text-xl"> {player.name} は力尽きた...</p>
            <p className="text-sm opacity-50">大魔王ヨシダは笑っている...</p>
          </div>
          <button 
            onClick={() => {
              playClickSound();
              setGameState('NAME_ENTRY');
              setMessages([]);
            }}
            className="p-4 border-2 border-white hover:bg-white hover:text-black transition-all text-sm font-bold tracking-widest"
          >
            タイトルに戻る
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-black text-white select-none overflow-hidden">
      {/* Game Container */}
      <div className="w-full max-w-2xl border-4 border-white p-4 flex flex-col gap-6 bg-black relative shadow-[0_0_20px_rgba(255,255,255,0.2)]">
        
        {/* Enemy Area */}
        <div className="h-64 flex flex-col items-center justify-center relative">
          <AnimatePresence>
            {gameState !== 'START' && enemy.hp > 0 && (
              <motion.div
                key="enemy"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ 
                  opacity: 1, 
                  scale: 1,
                  x: shake === 'enemy' ? [0, -10, 10, -10, 10, 0] : 0
                }}
                exit={{ opacity: 0, scale: 1.5, filter: 'brightness(2)' }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center"
              >
                <img 
                  src={enemy.sprite} 
                  alt={enemy.name}
                  referrerPolicy="no-referrer"
                  style={{ imageRendering: 'pixelated' }}
                  className="w-48 h-48 object-contain drop-shadow-[0_0_20px_rgba(255,255,255,0.4)] border-2 border-white/20 p-2 bg-white/5"
                />
                <div className="mt-4 text-sm bg-black/50 px-2 py-1 border border-white/30">
                  {enemy.name}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Damage Number Overlay */}
          <AnimatePresence>
            {damageEffect && damageEffect.target === 'enemy' && (
              <motion.div
                initial={{ y: 0, opacity: 1 }}
                animate={{ y: -50, opacity: 0 }}
                exit={{ opacity: 0 }}
                className="absolute text-4xl font-bold text-red-500 z-10"
              >
                {damageEffect.amount}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Message Log */}
        <div className="h-32 border-2 border-white p-3 overflow-y-auto bg-black font-retro text-[10px] leading-relaxed">
          {messages.map((msg, i) => (
            <div key={i} className="mb-1">
              {msg}
            </div>
          ))}
          <div ref={messageEndRef} />
        </div>

        {/* Bottom Panel: Status & Commands */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Player Status */}
          <div className="border-2 border-white p-3 flex flex-col gap-2">
            <div className="flex justify-between items-center border-b border-white/30 pb-1">
              <span className="text-xs">{player.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Heart className="w-3 h-3 text-red-500" />
              <div className="flex-1 h-2 bg-gray-800 border border-white/20">
                <motion.div 
                  className="h-full bg-green-500" 
                  animate={{ width: `${(player.hp / player.maxHp) * 100}%` }}
                />
              </div>
              <span className="text-[8px] w-14 text-right whitespace-nowrap">{player.hp}/{player.maxHp}</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-3 h-3 text-blue-400" />
              <div className="flex-1 h-2 bg-gray-800 border border-white/20">
                <motion.div 
                  className="h-full bg-blue-400" 
                  animate={{ width: `${(player.mp / player.maxMp) * 100}%` }}
                />
              </div>
              <span className="text-[8px] w-14 text-right whitespace-nowrap">{player.mp}/{player.maxMp}</span>
            </div>
          </div>

          {/* Command Menu */}
          <div className="border-2 border-white p-3 grid grid-cols-2 gap-2 relative">
            {/* Audio Toggle */}
            <button 
              onClick={() => {
                playClickSound();
                setIsMuted(!isMuted);
              }}
              className="absolute -top-10 right-0 text-[8px] border border-white/30 px-2 py-1 hover:bg-white hover:text-black transition-colors"
            >
              {isMuted ? '🔈 SOUND OFF' : '🔊 SOUND ON'}
            </button>

            {gameState === 'PLAYER_TURN' ? (
              menuType === 'MAIN' ? (
                <>
                  <button 
                    onClick={() => { playClickSound(); handlePlayerAttack(); }}
                    className="flex items-center gap-2 p-1 hover:bg-white hover:text-black transition-colors text-[10px] text-left"
                  >
                    <Sword className="w-3 h-3" /> たたかう
                  </button>
                  <button 
                    onClick={() => { playClickSound(); setMenuType('SKILL'); }}
                    className="flex items-center gap-2 p-1 hover:bg-white hover:text-black transition-colors text-[10px] text-left"
                  >
                    <Sparkles className="w-3 h-3" /> スキル
                  </button>
                  <button 
                    onClick={() => { playClickSound(); handlePlayerDefense(); }}
                    className="flex items-center gap-2 p-1 hover:bg-white hover:text-black transition-colors text-[10px] text-left"
                  >
                    <Shield className="w-3 h-3" /> ぼうぎょ
                  </button>
                  <button 
                    onClick={() => { playClickSound(); handlePlayerRun(); }}
                    className="flex items-center gap-2 p-1 hover:bg-white hover:text-black transition-colors text-[10px] text-left"
                  >
                    <LogOut className="w-3 h-3" /> にげる
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={() => { playClickSound(); handlePlayerSpecial(); }}
                    className="flex items-center gap-2 p-1 hover:bg-white hover:text-black transition-colors text-[10px] text-left"
                  >
                    <Sparkles className="w-3 h-3" /> 必殺
                  </button>
                  <button 
                    onClick={() => { playClickSound(); handlePlayerHeal(); }}
                    className="flex items-center gap-2 p-1 hover:bg-white hover:text-black transition-colors text-[10px] text-left"
                  >
                    <Heart className="w-3 h-3" /> 回復
                  </button>
                  <button 
                    onClick={() => { playClickSound(); setMenuType('MAIN'); }}
                    className="flex items-center gap-2 p-1 hover:bg-white hover:text-black transition-colors text-[10px] text-left"
                  >
                    <LogOut className="w-3 h-3" /> 戻る
                  </button>
                  <div className="p-1" /> {/* Spacer */}
                </>
              )
            ) : gameState === 'START' || gameState === 'VICTORY' || gameState === 'DEFEAT' ? (
              <button 
                onClick={() => { playClickSound(); startBattle(); }}
                className="col-span-2 p-2 bg-white text-black hover:bg-gray-200 transition-colors text-xs font-bold"
              >
                {gameState === 'START' ? '冒険を始める' : 'もう一度戦う'}
              </button>
            ) : (
              <div className="col-span-2 flex items-center justify-center text-[10px] animate-pulse">
                ...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Screen Flash Effect */}
      <AnimatePresence>
        {shake === 'player' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.5, 0] }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-red-600 pointer-events-none z-50"
          />
        )}
      </AnimatePresence>
    </div>
  );
}

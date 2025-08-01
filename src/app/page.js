"use client";
import { useEffect, useState, useRef } from "react";
import styles from "../app/styles/Game.module.css";

export default function Home() {
  const [planePosition, setPlanePosition] = useState(0);
  const [obstacles, setObstacles] = useState([]);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [stage, setStage] = useState(1);
  const [planeDesign, setPlaneDesign] = useState(1);
  const [obstacleSpeed, setObstacleSpeed] = useState(5);
  const [obstacleFrequency, setObstacleFrequency] = useState(2500);
  const [stageTransition, setStageTransition] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const gameAreaRef = useRef(null);
  const passedObstacles = useRef(new Set());

  // Background stars for visual effect
  const [stars, setStars] = useState([]);

  // Set initial plane position and stars
  useEffect(() => {
    if (gameAreaRef.current) {
      const height = gameAreaRef.current.clientHeight;
      const width = gameAreaRef.current.clientWidth;
      setPlanePosition((height - 40) / 2);

      // Generate initial stars
      const initialStars = Array.from({ length: 50 }, () => ({
        id: Math.random(),
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2 + 1,
        speed: Math.random() * 2 + 1,
      }));
      setStars(initialStars);
    }
  }, []);

  // Game controls
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!gameStarted && (e.key === "Enter" || e.key === " ")) {
        setGameStarted(true);
        return;
      }

      if (!gameOver && gameStarted && !stageTransition && gameAreaRef.current) {
        const height = gameAreaRef.current.clientHeight;
        if (e.key === "ArrowUp" && planePosition > 0) {
          setPlanePosition((prev) => Math.max(0, prev - 35));
        }
        if (e.key === "ArrowDown" && planePosition < height - 60) {
          setPlanePosition((prev) => Math.min(height - 60, prev + 35));
        }
      }
    };
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [gameOver, planePosition, gameStarted, stageTransition]);

  // Update stage based on score
  useEffect(() => {
    if (gameStarted && !gameOver) {
      // Check if score matches stage transition conditions
      if (score === 5 && stage === 1) {
        setStageTransition(true);
        setTimeout(() => {
          setStage(2);
          setObstacleSpeed(7);
          setObstacleFrequency(2000);
          setPlaneDesign(2);
          setStageTransition(false);
        }, 2000);
      } else if (score === 15 && stage === 2) {
        setStageTransition(true);
        setTimeout(() => {
          setStage(3);
          setObstacleSpeed(10);
          setObstacleFrequency(1500);
          setPlaneDesign(3);
          setStageTransition(false);
        }, 2000);
      } else if (score === 30 && stage === 3) {
        setStageTransition(true);
        setTimeout(() => {
          setStage(4);
          setObstacleSpeed(13);
          setObstacleFrequency(1200);
          setPlaneDesign(4);
          setStageTransition(false);
        }, 2000);
      }
    }
  }, [score, stage, gameOver, gameStarted]);

  // Generate obstacles
  useEffect(() => {
    if (gameStarted && !gameOver && !stageTransition) {
      const obstacleInterval = setInterval(() => {
        if (gameAreaRef.current) {
          const height = gameAreaRef.current.clientHeight;
          const width = gameAreaRef.current.clientWidth;

          // Different obstacle types based on stage
          let obstacleType = "regular";
          if (stage >= 2 && Math.random() > 0.7) {
            obstacleType = "moving";
          }
          if (stage >= 3 && Math.random() > 0.8) {
            obstacleType = "large";
          }

          const newObstacle = {
            id: Date.now(),
            position: width,
            height: Math.random() * (height - 100) + 50,
            type: obstacleType,
            direction: Math.random() > 0.5 ? 1 : -1, // For moving obstacles
            color: getRandomObstacleColor(stage),
          };
          setObstacles((prev) => [...prev, newObstacle]);
        }
      }, obstacleFrequency);

      return () => clearInterval(obstacleInterval);
    }
  }, [gameOver, stage, obstacleFrequency, gameStarted, stageTransition]);

  // Move obstacles, stars and check collision
  useEffect(() => {
    if (gameStarted && !gameOver && !stageTransition) {
      const gameLoop = setInterval(() => {
        // Update stars
        setStars((prevStars) => {
          if (gameAreaRef.current) {
            const width = gameAreaRef.current.clientWidth;
            return prevStars.map((star) => {
              let newX = star.x - star.speed;
              if (newX < 0) {
                newX = width;
              }
              return { ...star, x: newX };
            });
          }
          return prevStars;
        });

        // Update obstacles
        setObstacles((prev) => {
          const updatedObstacles = prev
            .map((obs) => {
              // Calculate new position
              let newPosition = obs.position - obstacleSpeed;

              // Moving obstacles change height
              let newHeight = obs.height;
              if (obs.type === "moving" && gameAreaRef.current) {
                const height = gameAreaRef.current.clientHeight;
                newHeight += obs.direction * 2;

                // Bounce when reaching boundaries
                if (newHeight < 50 || newHeight > height - 50) {
                  obs.direction *= -1;
                }
              }

              return {
                ...obs,
                position: newPosition,
                height: newHeight,
              };
            })
            .filter((obs) => obs.position > -50);

          // Check collisions
          updatedObstacles.forEach((obs) => {
            // Calculate collision box based on obstacle type
            let collisionSize = 60;
            if (obs.type === "large") {
              collisionSize = 80;
            }

            if (
              obs.position < 120 &&
              obs.position > 50 &&
              Math.abs(planePosition - obs.height) < collisionSize
            ) {
              setGameOver(true);
            }
            if (obs.position < 50 && !passedObstacles.current.has(obs.id)) {
              setScore((prev) => prev + 1);
              passedObstacles.current.add(obs.id);
            }
          });

          return updatedObstacles;
        });
      }, 16);

      return () => clearInterval(gameLoop);
    }
  }, [gameOver, planePosition, obstacleSpeed, gameStarted, stageTransition]);

  // Get random color for obstacles based on stage
  const getRandomObstacleColor = (stage) => {
    const stageColors = {
      1: ["#FF5733", "#C70039", "#900C3F"],
      2: ["#33A1FF", "#0C49C7", "#021F75"],
      3: ["#33FF57", "#0BC70D", "#075C09"],
      4: ["#D133FF", "#8A0BC7", "#450775"],
    };

    const colors = stageColors[stage] || stageColors[1];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  // Plane SVG based on design level
  const renderPlane = () => {
    switch (planeDesign) {
      case 2:
        return (
          <svg width="120" height="60" viewBox="0 0 120 60">
            <defs>
              <linearGradient
                id="bodyGradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop offset="0%" stopColor="#8A9EB5" />
                <stop offset="100%" stopColor="#C4D3E6" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Main body */}
            <ellipse
              cx="60"
              cy="30"
              rx="55"
              ry="15"
              fill="url(#bodyGradient)"
              stroke="#677D96"
              strokeWidth="1.5"
            />

            {/* Cockpit */}
            <ellipse
              cx="100"
              cy="30"
              rx="12"
              ry="8"
              fill="#A5CFFA"
              stroke="#677D96"
              strokeWidth="1"
            />

            {/* Windows */}
            <circle cx="40" cy="25" r="3" fill="#D6F7FF" />
            <circle cx="55" cy="25" r="3" fill="#D6F7FF" />
            <circle cx="70" cy="25" r="3" fill="#D6F7FF" />
            <circle cx="85" cy="25" r="3" fill="#D6F7FF" />

            {/* Wings */}
            <polygon
              points="25,30 65,5 105,30"
              fill="#7A92B2"
              stroke="#677D96"
              strokeWidth="1.5"
            />

            {/* Tail */}
            <polygon
              points="15,30 5,10 10,30 5,50"
              fill="#7A92B2"
              stroke="#677D96"
              strokeWidth="1.5"
            />

            {/* Engine glow */}
            <ellipse
              cx="5"
              cy="30"
              rx="3"
              ry="6"
              fill="#FFA500"
              filter="url(#glow)"
            />

            {/* Engines */}
            <ellipse
              cx="45"
              cy="38"
              rx="7"
              ry="5"
              fill="#3A4A5E"
              stroke="#677D96"
              strokeWidth="1"
            />
            <ellipse
              cx="75"
              cy="38"
              rx="7"
              ry="5"
              fill="#3A4A5E"
              stroke="#677D96"
              strokeWidth="1"
            />
          </svg>
        );
      case 3:
        return (
          <svg width="120" height="60" viewBox="0 0 120 60">
            <defs>
              <linearGradient
                id="bodyGradient3"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop offset="0%" stopColor="#676FA1" />
                <stop offset="100%" stopColor="#9DA6E8" />
              </linearGradient>
              <filter id="glow3">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Main body */}
            <ellipse
              cx="60"
              cy="30"
              rx="58"
              ry="14"
              fill="url(#bodyGradient3)"
              stroke="#444A6E"
              strokeWidth="2"
            />

            {/* Cockpit */}
            <ellipse
              cx="105"
              cy="30"
              rx="12"
              ry="8"
              fill="#B1C8FF"
              stroke="#444A6E"
              strokeWidth="1.5"
            />

            {/* Windows */}
            <rect x="35" y="23" width="50" height="4" rx="2" fill="#D6F7FF" />

            {/* Wings */}
            <polygon
              points="20,30 70,0 100,30"
              fill="#535A8A"
              stroke="#444A6E"
              strokeWidth="1.5"
            />
            <polygon
              points="20,30 70,60 100,30"
              fill="#535A8A"
              stroke="#444A6E"
              strokeWidth="1.5"
            />

            {/* Tail */}
            <polygon
              points="10,30 0,5 5,30 0,55"
              fill="#535A8A"
              stroke="#444A6E"
              strokeWidth="1.5"
            />

            {/* Engine glow */}
            <ellipse
              cx="3"
              cy="30"
              rx="5"
              ry="8"
              fill="#61DBFB"
              filter="url(#glow3)"
            />

            {/* Detail lines */}
            <path
              d="M 20,25 L 90,25"
              stroke="#444A6E"
              strokeWidth="0.5"
              strokeDasharray="5,3"
            />
            <path
              d="M 20,35 L 90,35"
              stroke="#444A6E"
              strokeWidth="0.5"
              strokeDasharray="5,3"
            />

            {/* Engines */}
            <ellipse
              cx="40"
              cy="40"
              rx="8"
              ry="6"
              fill="#282C44"
              stroke="#444A6E"
              strokeWidth="1.5"
            />
            <ellipse
              cx="80"
              cy="40"
              rx="8"
              ry="6"
              fill="#282C44"
              stroke="#444A6E"
              strokeWidth="1.5"
            />
          </svg>
        );
      case 4:
        return (
          <svg width="120" height="60" viewBox="0 0 120 60">
            <defs>
              <linearGradient
                id="bodyGradient4"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#424242" />
                <stop offset="50%" stopColor="#616161" />
                <stop offset="100%" stopColor="#212121" />
              </linearGradient>
              <filter id="glow4">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <linearGradient id="engineGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#FF3D00" />
                <stop offset="50%" stopColor="#FFAB00" />
                <stop offset="100%" stopColor="#FF3D00" />
              </linearGradient>
            </defs>

            {/* Main body */}
            <ellipse
              cx="60"
              cy="30"
              rx="60"
              ry="13"
              fill="url(#bodyGradient4)"
              stroke="#121212"
              strokeWidth="2"
            />

            {/* Cockpit */}
            <ellipse
              cx="108"
              cy="30"
              rx="10"
              ry="7"
              fill="#78909C"
              stroke="#121212"
              strokeWidth="1.5"
            />
            <ellipse
              cx="108"
              cy="30"
              rx="8"
              ry="5"
              fill="#B0BEC5"
              stroke="#121212"
              strokeWidth="0.5"
            />

            {/* Detail stripes */}
            <path d="M 20,26 L 95,26" stroke="#F5F5F5" strokeWidth="0.5" />
            <path d="M 20,34 L 95,34" stroke="#F5F5F5" strokeWidth="0.5" />

            {/* Wings - sleek and angular */}
            <polygon
              points="20,30 75,-5 110,30"
              fill="#424242"
              stroke="#212121"
              strokeWidth="1.5"
            />
            <polygon
              points="20,30 75,65 110,30"
              fill="#424242"
              stroke="#212121"
              strokeWidth="1.5"
            />

            {/* Tail - angular design */}
            <polygon
              points="10,30 0,10 5,30 0,50"
              fill="#424242"
              stroke="#212121"
              strokeWidth="1.5"
            />

            {/* Engine glow effects */}
            <ellipse
              cx="2"
              cy="30"
              rx="6"
              ry="9"
              fill="url(#engineGlow)"
              filter="url(#glow4)"
            />

            {/* Metallic accents */}
            <path
              d="M 85,20 L 100,20"
              stroke="#9E9E9E"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M 85,40 L 100,40"
              stroke="#9E9E9E"
              strokeWidth="2"
              strokeLinecap="round"
            />

            {/* Advanced engines */}
            <ellipse
              cx="35"
              cy="42"
              rx="9"
              ry="6"
              fill="#212121"
              stroke="#121212"
              strokeWidth="1.5"
            />
            <ellipse
              cx="35"
              cy="42"
              rx="6"
              ry="3"
              fill="#616161"
              stroke="#121212"
              strokeWidth="0.5"
            />
            <ellipse
              cx="75"
              cy="42"
              rx="9"
              ry="6"
              fill="#212121"
              stroke="#121212"
              strokeWidth="1.5"
            />
            <ellipse
              cx="75"
              cy="42"
              rx="6"
              ry="3"
              fill="#616161"
              stroke="#121212"
              strokeWidth="0.5"
            />
          </svg>
        );
      default: // Case 1 - Basic plane
        return (
          <svg width="120" height="60" viewBox="0 0 120 60">
            <ellipse
              cx="60"
              cy="30"
              rx="50"
              ry="15"
              fill="silver"
              stroke="darkgray"
              strokeWidth="1"
            />

            <ellipse
              cx="100"
              cy="30"
              rx="10"
              ry="6"
              fill="lightgray"
              stroke="darkgray"
              strokeWidth="1"
            />

            <circle cx="40" cy="25" r="2" fill="white" />
            <circle cx="50" cy="25" r="2" fill="white" />
            <circle cx="60" cy="25" r="2" fill="white" />
            <circle cx="70" cy="25" r="2" fill="white" />

            <polygon
              points="20,30 60,10 100,30"
              fill="gray"
              stroke="darkgray"
              strokeWidth="1"
            />

            <polygon
              points="15,30 5,15 10,30 5,45"
              fill="gray"
              stroke="darkgray"
              strokeWidth="1"
            />

            <ellipse cx="50" cy="38" rx="6" ry="4" fill="black" />
            <ellipse cx="70" cy="38" rx="6" ry="4" fill="black" />
          </svg>
        );
    }
  };

  // Restart game
  const restartGame = () => {
    if (gameAreaRef.current) {
      const height = gameAreaRef.current.clientHeight;
      setPlanePosition((height - 40) / 2);
    } else {
      setPlanePosition(300);
    }
    setObstacles([]);
    setScore(0);
    setGameOver(false);
    setStage(1);
    setPlaneDesign(1);
    setObstacleSpeed(5);
    setObstacleFrequency(2500);
    setStageTransition(false);
    setGameStarted(false);
    passedObstacles.current.clear();
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={"text-5xl text-white text-center"}>appXweb</div>

        <div className={"text-2xl text-white text-center"}>Score: {score}</div>
        <div className={"text-xl text-white text-center"}>Stage: {stage}</div>
      </div>

      <div
        className={`${styles.gameArea} ${
          stageTransition ? styles.stageTransition : ""
        }`}
        ref={gameAreaRef}
      >
        {/* Background stars */}
        {stars.map((star) => (
          <div
            key={star.id}
            className={styles.star}
            style={{
              left: `${star.x}px`,
              top: `${star.y}px`,
              width: `${star.size}px`,
              height: `${star.size}px`,
            }}
          />
        ))}

        {/* Player plane */}
        <div
          className={`${styles.plane} ${gameStarted ? styles.active : ""}`}
          style={{ top: `${planePosition}px` }}
        >
          {renderPlane()}
        </div>

        {/* Obstacles */}
        {obstacles.map((obs) => (
          <div
            key={obs.id}
            className={`${styles.obstacle} ${styles[obs.type] || ""}`}
            style={{
              left: `${obs.position}px`,
              top: `${obs.height}px`,
              backgroundColor: obs.color,
            }}
          />
        ))}

        {/* Start screen */}
        {!gameStarted && !gameOver && (
          <div className={"text-center"}>
            <h1>Airplane Adventure</h1>
            <p>Press ENTER or SPACE to start</p>
            <p>Use UP and DOWN arrows to control the plane</p>
          </div>
        )}

        {/* Stage transition */}
        {stageTransition && (
          <div className={styles.stageScreen}>
            <h2>Stage {stage + 1}</h2>
            <p>Get ready for the next challenge!</p>
          </div>
        )}

        {/* Game over screen */}
        {gameOver && (
          <div className={styles.gameOver}>
            <h2>Game Over!</h2>
            <p>Final Score: {score}</p>
            <p>You reached Stage {stage}</p>
            <button onClick={restartGame}>Play Again</button>
          </div>
        )}
      </div>
    </div>
  );
}

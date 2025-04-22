import React, { useRef, useState, useEffect, useMemo, Suspense } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, Sky, Text, useProgress, Html } from '@react-three/drei';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import * as THREE from 'three';
import '../css/StadiumVR.css';

// Loader component to show loading progress
const Loader = () => {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="cricket-custom-loader">
        <div className="cricket-loading-spinner"></div>
        <div className="cricket-loading-text">Loading Stadium Model ({Math.round(progress)}%)</div>
      </div>
    </Html>
  );
};

// Stadium Model Component - uses the imported FBX
const ImportedStadium = () => {
  const fbx = useLoader(FBXLoader, '/models/stadium/EkanaStadium1.fbx');
  const stadiumRef = useRef();
  
  useEffect(() => {
    if (fbx) {
      // Apply textures if needed
      fbx.traverse((child) => {
        if (child.isMesh) {
          // Create a texture loader
          const textureLoader = new THREE.TextureLoader();
          // Load texture
          const texture = textureLoader.load('/models/stadium/textures/EkanaStadium.png');
          // Apply texture to the material
          child.material = new THREE.MeshStandardMaterial({ 
            map: texture,
            roughness: 0.7,
            metalness: 0.2,
            side: THREE.DoubleSide
          });
          
          // Enable shadows
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      
      // Scale and position the stadium model if needed
      fbx.scale.set(0.9, 0.9, 0.9); // Adjust scale as needed
      fbx.position.set(0, -10, 0); // Adjust position as needed
      fbx.rotation.y = Math.PI; // Rotate if needed
    }
  }, [fbx]);
  
  return (
    <primitive ref={stadiumRef} object={fbx} dispose={null} />
  );
};

// Existing components with minor adjustments
const BatsmanModel = () => {
  // Position adjusted to fit in the imported stadium
  return (
    <group position={[0, 0, 0]}>
      {/* Body */}
      <mesh position={[0, 1, 0]} castShadow>
        <capsuleGeometry args={[0.3, 1, 8, 16]} />
        <meshStandardMaterial color="#1a237e" /> {/* Team color */}
      </mesh>
      
      {/* Head */}
      <mesh position={[0, 2, 0]} castShadow>
        <sphereGeometry args={[0.25, 32, 32]} />
        <meshStandardMaterial color="#f5deb3" /> {/* Skin color */}
      </mesh>
      
      {/* Helmet */}
      <mesh position={[0, 2.1, 0]} castShadow>
        <sphereGeometry args={[0.28, 32, 32]} />
        <meshStandardMaterial color="#3f51b5" /> {/* Blue helmet */}
      </mesh>
      
      {/* Bat */}
      <group position={[0.5, 1.2, 0]} rotation={[0, 0, Math.PI / 6]}>
        {/* Handle */}
        <mesh castShadow>
          <cylinderGeometry args={[0.05, 0.05, 0.6, 8]} />
          <meshStandardMaterial color="#4d2600" />
        </mesh>
        
        {/* Blade */}
        <mesh position={[0, -0.5, 0]} castShadow>
          <boxGeometry args={[0.12, 0.8, 0.03]} />
          <meshStandardMaterial color="#f5f5dc" />
        </mesh>
      </group>
      
      {/* Legs */}
      <mesh position={[-0.15, 0.4, 0]} castShadow>
        <capsuleGeometry args={[0.12, 0.8, 8, 16]} />
        <meshStandardMaterial color="#1a237e" />
      </mesh>
      <mesh position={[0.15, 0.4, 0]} castShadow>
        <capsuleGeometry args={[0.12, 0.8, 8, 16]} />
        <meshStandardMaterial color="#1a237e" />
      </mesh>
      
      {/* Pads */}
      <mesh position={[-0.15, 0.3, 0.1]} castShadow>
        <boxGeometry args={[0.2, 0.6, 0.1]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0.15, 0.3, 0.1]} castShadow>
        <boxGeometry args={[0.2, 0.6, 0.1]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
    </group>
  );
};

// Simple pitch and wickets for the center of the stadium
const PitchAndWickets = () => {
  return (
    <group>
      {/* Pitch */}
      {/* Pitch */}
  <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
    <planeGeometry args={[3, 20]} />
    <meshStandardMaterial 
      color="#d2b48c" 
      transparent={true}
      opacity={1}
      side={THREE.DoubleSide}
    />
  </mesh>
      {/* Crease lines */}
      <CreaseLines />
      
      {/* Wickets */}
      <group position={[0, 0.5, -10]}>
        <Wickets />
      </group>
      <group position={[0, 0.5, 10]}>
        <Wickets />
      </group>
    </group>
  );
};

// Keeping the same crease lines component
const CreaseLines = () => {
  return (
    <group>
      {/* Batting crease - near end */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -10]}>
        <planeGeometry args={[4, 0.1]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      
      {/* Popping crease - near end */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -8.5]}>
        <planeGeometry args={[4, 0.1]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      
      {/* Batting crease - far end */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 10]}>
        <planeGeometry args={[4, 0.1]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      
      {/* Popping crease - far end */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 8.5]}>
        <planeGeometry args={[4, 0.1]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
    </group>
  );
};

// Keeping the same wickets component
const Wickets = () => {
  return (
    <group>
      {/* Three Stumps */}
      <mesh position={[-0.12, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.03, 0.03, 0.7, 8]} />
        <meshStandardMaterial color="#f5f5dc" />
      </mesh>
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.03, 0.03, 0.7, 8]} />
        <meshStandardMaterial color="#f5f5dc" />
      </mesh>
      <mesh position={[0.12, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.03, 0.03, 0.7, 8]} />
        <meshStandardMaterial color="#f5f5dc" />
      </mesh>
      
      {/* Two Bails */}
      <mesh position={[-0.06, 0.87, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.02, 0.02, 0.12, 8]} />
        <meshStandardMaterial color="#f5f5dc" />
      </mesh>
      <mesh position={[0.06, 0.87, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.02, 0.02, 0.12, 8]} />
        <meshStandardMaterial color="#f5f5dc" />
      </mesh>
    </group>
  );
};

// ShotVisualization component - keeping the same logic
const ShotVisualization = ({ playerStats, playerShots, playAnimations }) => {
  const { fours, sixes } = playerStats;
  const group = useRef();
  const [animationStarted, setAnimationStarted] = useState(false);
  
  // Function to get a random zone based on shot type
  const getRandomZone = (type) => {
    if (type === 'four') {
      const fourZones = ['Cover', 'Mid-wicket', 'Point', 'Fine Leg', 'Third Man'];
      return fourZones[Math.floor(Math.random() * fourZones.length)];
    } else {
      const sixZones = ['Long-on', 'Long-off', 'Deep Mid-wicket', 'Deep Square Leg'];
      return sixZones[Math.floor(Math.random() * sixZones.length)];
    }
  };
  
  // Create shot data based on player's actual stats
  const shotData = useMemo(() => {
    const shots = [];
    
    // Set a maximum for how many shots to display
    const maxShots = 20; // Total shots to display
    
    // Try to get equal numbers of fours and sixes
    const displayCount = Math.min(maxShots, fours + sixes);
    
    // Calculate how many of each type to show
    let foursToShow, sixesToShow;
    
    // If we have actual shot data from the Python analysis
    if (playerShots && playerShots.length > 0) {
      // Filter shots by type
      const fourShots = playerShots.filter(shot => shot.type === 'four');
      const sixShots = playerShots.filter(shot => shot.type === 'six');
      
      // Determine how many of each to show for balanced visualization
      if (fourShots.length === 0 && sixShots.length === 0) {
        return []; // No shots to display
      } else if (fourShots.length === 0) {
        sixesToShow = Math.min(sixShots.length, maxShots);
        foursToShow = 0;
      } else if (sixShots.length === 0) {
        foursToShow = Math.min(fourShots.length, maxShots);
        sixesToShow = 0;
      } else {
        // Aim for roughly equal numbers
        const totalShots = Math.min(fourShots.length + sixShots.length, maxShots);
        foursToShow = Math.floor(totalShots / 2);
        sixesToShow = totalShots - foursToShow;
        
        // Adjust to make sure we don't exceed actual counts
        if (foursToShow > fourShots.length) {
          const extra = foursToShow - fourShots.length;
          foursToShow = fourShots.length;
          sixesToShow = Math.min(sixShots.length, sixesToShow + extra);
        }
        if (sixesToShow > sixShots.length) {
          const extra = sixesToShow - sixShots.length;
          sixesToShow = sixShots.length;
          foursToShow = Math.min(fourShots.length, foursToShow + extra);
        }
      }
      
      // Add four shots
      for (let i = 0; i < foursToShow; i++) {
        const shot = fourShots[i % fourShots.length];
        shots.push({
          type: 'four',
          angle: Math.random() * Math.PI * 2,
          color: '#4285f4',
          delay: 0,
          zones: shot.zone || getRandomZone('four')
        });
      }
      
      // Add six shots
      for (let i = 0; i < sixesToShow; i++) {
        const shot = sixShots[i % sixShots.length];
        shots.push({
          type: 'six',
          angle: Math.random() * Math.PI * 2,
          color: '#ea4335',
          delay: 0,
          zones: shot.zone || getRandomZone('six')
        });
      }
    } else {
      // Generate synthetic data for equal visualization
      const totalShots = Math.min(maxShots, fours + sixes);
      
      // Try to get equal numbers of each type
      if (fours === 0 && sixes === 0) {
        return []; // No shots to display
      } else if (fours === 0) {
        sixesToShow = Math.min(sixes, maxShots);
        foursToShow = 0;
      } else if (sixes === 0) {
        foursToShow = Math.min(fours, maxShots);
        sixesToShow = 0;
      } else {
        // Aim for roughly equal numbers
        foursToShow = Math.floor(totalShots / 2);
        sixesToShow = totalShots - foursToShow;
        
        // Adjust to make sure we don't exceed actual counts
        if (foursToShow > fours) {
          const extra = foursToShow - fours;
          foursToShow = fours;
          sixesToShow = Math.min(sixes, sixesToShow + extra);
        }
        if (sixesToShow > sixes) {
          const extra = sixesToShow - sixes;
          sixesToShow = sixes;
          foursToShow = Math.min(fours, foursToShow + extra);
        }
      }
      
      // Generate four shots with evenly distributed angles
      for (let i = 0; i < foursToShow; i++) {
        const angle = (i * Math.PI * 2) / foursToShow + (Math.random() * 0.2 - 0.1);
        shots.push({
          type: 'four',
          angle,
          color: '#4285f4', // Blue color for fours
          delay: 0,
          zones: getRandomZone('four')
        });
      }
      
      // Generate six shots with evenly distributed angles
      for (let i = 0; i < sixesToShow; i++) {
        const angle = (i * Math.PI * 2) / sixesToShow + (Math.random() * 0.2 - 0.1);
        shots.push({
          type: 'six',
          angle, 
          color: '#ea4335', // Red color for sixes
          delay: 0,
          zones: getRandomZone('six')
        });
      }
    }
    
    return shots;
  }, [fours, sixes, playerShots]);
  
  // Start animation when playAnimations changes
  useEffect(() => {
    if (playAnimations) {
      setAnimationStarted(true);
    } else {
      setAnimationStarted(false);
    }
  }, [playAnimations]);

  return (
    <group ref={group}>
      {shotData.map((shot, index) => (
        <ShotPath 
          key={index}
          type={shot.type}
          angle={shot.angle}
          color={shot.color}
          zone={shot.zones}
          animationStarted={animationStarted}
          playAnimation={playAnimations}
        />
      ))}
    </group>
  );
};

// ShotPath component - same logic with adjusted boundaries to fit the imported stadium
const ShotPath = ({ type, angle, color, zone, animationStarted, playAnimation }) => {
  const tubeRef = useRef();
  const ballRef = useRef();
  const [progress, setProgress] = useState(0);
  const [ballVisible, setBallVisible] = useState(true);
  
  // Define path points - adjusted distances for the imported stadium
  const { curve, points } = useMemo(() => {
    // Adjust these values based on your imported stadium dimensions
    const fourDistance = 45; // Distance to boundary for fours - smaller than before
    const sixDistance = 55;  // Distance for sixes - smaller than before
    
    if (type === 'four') {
      const maxHeight = 6; // Maximum height for a four
      
      // Create a more natural arc with a slight curve
      const curve = new THREE.CubicBezierCurve3(
        new THREE.Vector3(0, 0.5, 0),
        new THREE.Vector3(
          Math.sin(angle) * fourDistance * 0.3,
          maxHeight,
          Math.cos(angle) * fourDistance * 0.3
        ),
        new THREE.Vector3(
          Math.sin(angle) * fourDistance * 0.7,
          maxHeight * 0.8,
          Math.cos(angle) * fourDistance * 0.7
        ),
        new THREE.Vector3(
          Math.sin(angle) * fourDistance,
          0.5,
          Math.cos(angle) * fourDistance
        )
      );
      
      // Get points along the curve for animation
      const points = curve.getPoints(50);
      
      return { curve, points };
    } else if (type === 'six') {
      const maxHeight = 20; // Maximum height for a six
      
      // Create a more parabolic arc for sixes
      const curve = new THREE.CubicBezierCurve3(
        new THREE.Vector3(0, 0.5, 0),
        new THREE.Vector3(
          Math.sin(angle) * sixDistance * 0.3,
          maxHeight * 0.9,
          Math.cos(angle) * sixDistance * 0.3
        ),
        new THREE.Vector3(
          Math.sin(angle) * sixDistance * 0.7,
          maxHeight,
          Math.cos(angle) * sixDistance * 0.7
        ),
        new THREE.Vector3(
          Math.sin(angle) * sixDistance,
          0.5,
          Math.cos(angle) * sixDistance
        )
      );
      
      // Get points along the curve for animation
      const points = curve.getPoints(50);
      
      return { curve, points };
    }
    
    return { curve: null, points: [] };
  }, [type, angle]);
  
  // Animation loop
  useFrame(() => {
    if (animationStarted && playAnimation && progress < 1) {
      // Increment progress - adjust speed here
      setProgress(prev => Math.min(prev + 0.015, 1));
    }
    
    // Update ball position along the path
    if (ballRef.current && points.length > 0 && ballVisible) {
      const pointIndex = Math.min(Math.floor(progress * points.length), points.length - 1);
      const point = points[pointIndex];
      ballRef.current.position.set(point.x, point.y, point.z);
      
      // Hide ball at the end
      if (progress >= 1) {
        setBallVisible(false);
      }
    }
    
    // Update tube visibility based on progress
    if (tubeRef.current) {
      // Make tube material more translucent at the beginning and fully opaque at the end
      const opacity = Math.min(progress * 2, 1);
      tubeRef.current.material.opacity = opacity;
    }
  });
  
  // Reset animation when play/pause changes
  useEffect(() => {
    if (!playAnimation) {
      setProgress(0);
      setBallVisible(true);
    }
  }, [playAnimation]);
  
  // Create a tube geometry along the curve
  const tubeGeometry = useMemo(() => {
    if (!curve) return null;
    
    // Create a tube along the curve with radius determining thickness (ball-like)
    return new THREE.TubeGeometry(
      curve,
      64,  // tubularSegments
      0.3,  // tube radius - thicker for visible paths
      8,   // radiusSegments
      false // closed
    );
  }, [curve]);
  
  return (
    <group>
      {/* Trajectory tube - more visible than line */}
      {tubeGeometry && (
        <mesh ref={tubeRef} geometry={tubeGeometry}>
          <meshStandardMaterial 
            color={color} 
            transparent={true} 
            opacity={0}
            emissive={color}
            emissiveIntensity={0.5}
          />
        </mesh>
      )}
      
      {/* Cricket ball */}
      {ballVisible && (
        <mesh ref={ballRef} castShadow scale={0.5}>
          <sphereGeometry args={[0.5, 32, 32]} />
          <meshStandardMaterial color={type === 'four' ? '#ffffff' : '#e53935'} />
        </mesh>
      )}
      
      {/* Zone label at end point */}
      {progress > 0.95 && points.length > 0 && (
        <Text
          position={[
            points[points.length - 1].x,
            points[points.length - 1].y + 2,
            points[points.length - 1].z
          ]}
          fontSize={1.5}
          color={color}
          anchorX="center"
          anchorY="middle"
        >
          {zone} ({type === 'four' ? '4' : '6'})
        </Text>
      )}
    </group>
  );
};

// Main Component
const StadiumVRPage = () => {
  const [topPlayers, setTopPlayers] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [playerStats, setPlayerStats] = useState(null);
  const [playAnimations, setPlayAnimations] = useState(true);
  const [selectedView, setSelectedView] = useState('stadium');
  const [isLoading, setIsLoading] = useState(true);

 
  useEffect(() => {
    const fetchTopPlayers = async () => {
      try {
        const response = await fetch('/stats/top_players.json');
        const data = await response.json();
        setTopPlayers(data.topPlayers);
        
        // Set the first player as default selected player
        if (data.topPlayers && data.topPlayers.length > 0) {
          setSelectedPlayer(data.topPlayers[0]);
          setPlayerStats({
            name: data.topPlayers[0].name,
            team: data.topPlayers[0].team,
            matches: data.topPlayers[0].matches,
            runs: data.topPlayers[0].runs,
            average: data.topPlayers[0].average,
            strikeRate: data.topPlayers[0].strikeRate,
            fours: data.topPlayers[0].fours,
            sixes: data.topPlayers[0].sixes
          });
        }
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching player data:", error);
        setIsLoading(false);
      }
    };
    
    fetchTopPlayers();
  }, []);

  const handlePlayerSelect = (player) => {
    setSelectedPlayer(player);
    setPlayerStats({
      name: player.name,
      team: player.team,
      matches: player.matches,
      runs: player.runs,
      average: player.average,
      strikeRate: player.strikeRate,
      fours: player.fours,
      sixes: player.sixes
    });
    
    // Reset animation when selecting a new player
    setPlayAnimations(true);
  };

  const handleViewChange = (view) => {
    setSelectedView(view);
  };

  // Adjusted camera positions to work better with the imported stadium
  const getCameraPosition = () => {
    switch (selectedView) {
      case 'overhead':
        return { position: [0, 50, 0], fov: 60 };
      case 'batsman':
        return { position: [1, 5, 2], fov: 50 };
      case 'stadium':
      default:
        return { position: [0, 25, 45], fov: 50 };
    }
  };

  return (
    <div className="cricket-stadium-vr-container">
      <h1 className="cricket-vr-title">Cricket Stadium VR Experience</h1>
      
      {/* Player Selection Area */}
      <div className="cricket-player-selector">
        <h2>Top Boundary Hitters</h2>
        <div className="cricket-player-list">
          {topPlayers.map((player, index) => (
            <div 
              key={player.id}
              className={`cricket-player-item ${selectedPlayer && selectedPlayer.id === player.id ? 'active' : ''}`}
              onClick={() => handlePlayerSelect(player)}
            >
              <span className="cricket-player-rank">{index + 1}</span>
              <span className="cricket-player-name">{player.name}</span>
              <span className="cricket-player-team">({player.team})</span>
              <div className="cricket-player-boundaries">
                <span className="cricket-fours">{player.fours} 4s</span>
                <span className="cricket-sixes">{player.sixes} 6s</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="cricket-canvas-container">
        {isLoading ? (
          <div className="cricket-loading-spinner"></div>
        ) : (
          <Canvas shadows camera={getCameraPosition()}>
            <Sky sunPosition={[0, 1, 0]} />
            <ambientLight intensity={0.5} />
            <directionalLight
              castShadow
              position={[10, 20, 15]}
              intensity={1}
              shadow-mapSize={1024}
              shadow-bias={-0.0005}
            />
            
            {/* Use Suspense for asynchronous loading of the FBX model */}
            <Suspense fallback={<Loader />}>
              <ImportedStadium />
              {/* Add the pitch and wickets separately */}
              <PitchAndWickets />
            </Suspense>
            
            <BatsmanModel />
            {playerStats && (
              <ShotVisualization 
                playerStats={playerStats} 
                playerShots={selectedPlayer?.shots || []}
                playAnimations={playAnimations}
              />
            )}
            <OrbitControls 
              enableZoom={true}
              enablePan={true}
              enableRotate={true}
              target={[0, 2, 0]}
            />
          </Canvas>
        )}
      </div>
      
      {playerStats && (
        <div className="cricket-player-stats">
          <h2>{playerStats.name}</h2>
          <div className="cricket-team-badge">{playerStats.team}</div>
          <div className="cricket-stats-grid">
            <div className="cricket-stat-item">
              <span className="cricket-stat-label">Matches</span>
              <span className="cricket-stat-value">{playerStats.matches}</span>
            </div>
            <div className="cricket-stat-item">
              <span className="cricket-stat-label">Runs</span>
              <span className="cricket-stat-value">{playerStats.runs}</span>
            </div>
            <div className="cricket-stat-item">
              <span className="cricket-stat-label">Average</span>
              <span className="cricket-stat-value">{playerStats.average}</span>
            </div>
            <div className="cricket-stat-item">
              <span className="cricket-stat-label">Strike Rate</span>
              <span className="cricket-stat-value">{playerStats.strikeRate}</span>
            </div>
            <div className="cricket-stat-item">
              <span className="cricket-stat-label">Fours</span>
              <span className="cricket-stat-value">{playerStats.fours}</span>
            </div>
            <div className="cricket-stat-item">
              <span className="cricket-stat-label">Sixes</span>
              <span className="cricket-stat-value">{playerStats.sixes}</span>
            </div>
          </div>
        </div>
      )}
      
      <div className="cricket-controls-container">
        <button 
          className={`cricket-view-button ${selectedView === 'stadium' ? 'active' : ''}`}
          onClick={() => handleViewChange('stadium')}
        >
          Stadium View
        </button>
        <button 
          className={`cricket-view-button ${selectedView === 'overhead' ? 'active' : ''}`}
          onClick={() => handleViewChange('overhead')}
        >
          Overhead View
        </button>
        <button 
          className={`cricket-view-button ${selectedView === 'batsman' ? 'active' : ''}`}
          onClick={() => handleViewChange('batsman')}
        >
          Batsman View
        </button>
        <button 
          className="cricket-play-button"
          onClick={() => setPlayAnimations(!playAnimations)}
        >
          {playAnimations ? 'Pause Shots' : 'Play Shots'}
        </button>
      </div>
    </div>
  );
};

export default StadiumVRPage;
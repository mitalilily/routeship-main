import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";

const BLUE = 0x310276;
const ORANGE = 0xFE6502;
const CLIENT_AUTH_PATH = "/login";

const features = [
  ["01", "One smart dashboard", "Orders, labels, NDR, tracking and analytics — finally speaking the same language.", "grid"],
  ["02", "Rate intelligence", "Compare live courier rates and delivery performance before every shipment.", "wallet"],
  ["03", "Branded tracking", "Turn every tracking check into a clear, reassuring extension of your brand.", "pin"],
  ["04", "NDR automation", "Recover risky deliveries with automated buyer outreach and rapid action loops.", "spark"],
  ["05", "COD reconciliation", "Know what is collected, remitted and pending without spreadsheet archaeology.", "coins"],
  ["06", "Actionable analytics", "See cost, RTO and performance patterns early enough to actually change them.", "chart"],
];

const faqs = [
  ["How quickly can we start shipping?", "Most teams connect a store, add pickup details and create their first label in under 30 minutes. Our onboarding team can help with larger catalogues and custom workflows."],
  ["Do I need contracts with every courier?", "No. RouteShip gives you access to multiple courier partners through one account, one wallet and one operating layer."],
  ["Can RouteShip connect to our current store?", "Yes. Native integrations cover major commerce platforms, with REST APIs and webhooks available for custom storefronts and internal tools."],
  ["How do you handle failed deliveries?", "Our NDR workflow triggers fast buyer communication, verifies delivery details and routes the right action back to the courier."],
  ["Is there a minimum shipment volume?", "No minimum on Launch. Growing teams can move to Scale for deeper automation, lower rates and priority support."],
];

function Icon({ name }) {
  const paths = {
    arrow: <><path d="M5 12h14M13 6l6 6-6 6"/><path d="M19 12"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    play: <path d="m9 7 8 5-8 5V7Z"/>,
    box: <><path d="m4 7 8-4 8 4-8 4-8-4Z"/><path d="M4 7v10l8 4 8-4V7M12 11v10"/></>,
    menu: <><path d="M4 7h16M4 12h16M4 17h16"/></>,
    close: <><path d="m6 6 12 12M18 6 6 18"/></>,
    grid: <><rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/></>,
    wallet: <><path d="M4 7h14a2 2 0 0 1 2 2v9H6a2 2 0 0 1-2-2V7Z"/><path d="M4 7V6a2 2 0 0 1 2-2h10v3M15 12h5"/></>,
    pin: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></>,
    spark: <><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z"/><path d="m19 16 .7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7L19 16Z"/></>,
    coins: <><ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v5c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 11v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5"/></>,
    chart: <><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></>,
    truck: <><path d="M3 6h11v11H3zM14 10h4l3 3v4h-7z"/><circle cx="7" cy="18" r="2"/><circle cx="18" cy="18" r="2"/></>,
    scan: <><path d="M8 3H4a1 1 0 0 0-1 1v4M16 3h4a1 1 0 0 1 1 1v4M8 21H4a1 1 0 0 1-1-1v-4M16 21h4a1 1 0 0 0 1-1v-4M7 12h10"/></>,
  };
  return <svg aria-hidden="true" className="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

function WebGLScene({ compact = false }) {
  const mount = useRef(null);

  useEffect(() => {
    const host = mount.current;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, host.clientWidth / host.clientHeight, 0.1, 100);
    camera.position.set(0, 0, 8);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
    renderer.setSize(host.clientWidth, host.clientHeight);
    host.appendChild(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);

    const createParcel = (size = .24) => {
      const parcel = new THREE.Group();
      const cardboard = new THREE.Mesh(new THREE.BoxGeometry(size * 1.15, size, size), new THREE.MeshBasicMaterial({ color: 0xb9783f }));
      parcel.add(cardboard);
      const edges = new THREE.LineSegments(new THREE.EdgesGeometry(cardboard.geometry), new THREE.LineBasicMaterial({ color: 0x6f3d1d, transparent: true, opacity: .9 }));
      parcel.add(edges);
      const tape = new THREE.Mesh(new THREE.BoxGeometry(size * .18, size * 1.015, size * 1.015), new THREE.MeshBasicMaterial({ color: ORANGE }));
      parcel.add(tape);
      const label = new THREE.Mesh(new THREE.PlaneGeometry(size * .48, size * .3), new THREE.MeshBasicMaterial({ color: 0xf7efe4 }));
      label.position.set(size * .18, 0, size * .505);
      parcel.add(label);
      const barcode = new THREE.Mesh(new THREE.PlaneGeometry(size * .28, size * .055), new THREE.MeshBasicMaterial({ color: BLUE }));
      barcode.position.set(size * .18, 0, size * .51);
      parcel.add(barcode);
      return parcel;
    };

    const core = new THREE.Mesh(
      new THREE.SphereGeometry(compact ? 1.35 : 1.65, 28, 18),
      new THREE.MeshBasicMaterial({ color: BLUE, wireframe: true, transparent: true, opacity: 0.52 })
    );
    group.add(core);

    const innerGlow = new THREE.Mesh(
      new THREE.SphereGeometry(compact ? 1.22 : 1.5, 24, 16),
      new THREE.MeshBasicMaterial({ color: 0xf4eee4, transparent: true, opacity: 0.72 })
    );
    group.add(innerGlow);

    const ringMaterial = new THREE.MeshBasicMaterial({ color: ORANGE, wireframe: true, transparent: true, opacity: 0.6 });
    [2.15, 2.65, 3.1].forEach((radius, index) => {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.012 + index * 0.006, 8, 140), ringMaterial.clone());
      ring.rotation.x = 1.1 + index * 0.35;
      ring.rotation.y = index * 0.7;
      group.add(ring);
    });

    const routeMovers = [];
    const routeSpecs = [
      [[-1.45, .35, .55], [0, 2.35, 1.25], [1.35, -.2, .7], ORANGE],
      [[-.9, -1.1, .75], [.2, .55, 2.2], [1.4, .65, .2], BLUE],
      [[-1.25, .75, -.5], [0, 2.1, -.2], [.9, -.95, -.65], ORANGE],
      [[-1.4, -.35, -.35], [-.1, -2.15, .8], [1.28, .3, -.5], BLUE],
      [[-.45, 1.45, .2], [1.8, 1.65, .75], [1.15, -.85, .4], ORANGE],
    ];
    routeSpecs.forEach(([start, control, end, color], index) => {
      const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(...start), new THREE.Vector3(...control), new THREE.Vector3(...end));
      const route = new THREE.Mesh(new THREE.TubeGeometry(curve, 48, .022, 6, false), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .9 }));
      group.add(route);
      const mover = createParcel(.2 + (index % 2) * .035);
      mover.userData = { curve, offset: index / routeSpecs.length };
      routeMovers.push(mover);
      group.add(mover);
      [start, end].forEach((point, pointIndex) => {
        const node = new THREE.Mesh(new THREE.SphereGeometry(.07, 10, 10), new THREE.MeshBasicMaterial({ color: pointIndex ? ORANGE : BLUE }));
        node.position.set(...point);
        group.add(node);
      });
    });

    const orbitParcels = [];
    for (let i = 0; i < 16; i += 1) {
      const box = createParcel(.18 + (i % 4) * .025);
      const angle = (i / 16) * Math.PI * 2;
      box.position.set(Math.cos(angle) * (2.5 + (i % 3) * 0.35), Math.sin(angle * 1.7) * 1.4, Math.sin(angle) * 1.3);
      box.rotation.set(angle, angle * 0.6, 0);
      box.userData.floatOffset = i * .6;
      orbitParcels.push(box);
      group.add(box);
    }

    const hub = new THREE.Group();
    const hubBase = new THREE.Mesh(new THREE.CylinderGeometry(.42, .52, .18, 6), new THREE.MeshBasicMaterial({ color: BLUE }));
    const hubRoof = new THREE.Mesh(new THREE.ConeGeometry(.52, .28, 6), new THREE.MeshBasicMaterial({ color: ORANGE }));
    hubRoof.position.y = .23;
    hub.add(hubBase, hubRoof);
    hub.position.set(0, -2.35, .15);
    hub.rotation.z = .06;
    group.add(hub);

    const particlePositions = new Float32Array(450 * 3);
    for (let i = 0; i < 450; i += 1) {
      const r = 2.2 + Math.random() * 3.1;
      const a = Math.random() * Math.PI * 2;
      particlePositions[i * 3] = Math.cos(a) * r;
      particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 4;
      particlePositions[i * 3 + 2] = Math.sin(a) * r;
    }
    const particlesGeometry = new THREE.BufferGeometry();
    particlesGeometry.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
    const particles = new THREE.Points(particlesGeometry, new THREE.PointsMaterial({ color: 0x6f95ff, size: 0.018, transparent: true, opacity: 0.7 }));
    group.add(particles);

    let mx = 0;
    let my = 0;
    let frame;
    const move = (event) => {
      mx = (event.clientX / window.innerWidth - 0.5) * 0.35;
      my = (event.clientY / window.innerHeight - 0.5) * 0.25;
    };
    const resize = () => {
      camera.aspect = host.clientWidth / host.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(host.clientWidth, host.clientHeight);
    };
    const render = (time = 0) => {
      if (!reduce) {
        group.rotation.y += 0.0018;
        group.rotation.x += (my - group.rotation.x) * 0.025;
        group.rotation.z += (mx - group.rotation.z) * 0.018;
        core.scale.setScalar(1 + Math.sin(time * 0.0012) * 0.035);
        routeMovers.forEach((mover, index) => {
          mover.position.copy(mover.userData.curve.getPoint((time * .00008 + mover.userData.offset) % 1));
          mover.rotation.y = time * .001 + index;
          mover.rotation.x = Math.sin(time * .0012 + index) * .25;
        });
        orbitParcels.forEach((parcel) => {
          parcel.rotation.x += .006;
          parcel.rotation.y += .008;
          parcel.position.y += Math.sin(time * .0015 + parcel.userData.floatOffset) * .0008;
        });
      }
      renderer.render(scene, camera);
      frame = requestAnimationFrame(render);
    };
    window.addEventListener("mousemove", move, { passive: true });
    window.addEventListener("resize", resize);
    render();
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("mousemove", move);
      window.removeEventListener("resize", resize);
      renderer.dispose();
      particlesGeometry.dispose();
      host.removeChild(renderer.domElement);
    };
  }, [compact]);

  return <div className={`webgl ${compact ? "webgl-compact" : ""}`} ref={mount} aria-hidden="true" />;
}

function Reveal({ children, className = "" }) {
  const ref = useRef(null);
  useEffect(() => {
    const node = ref.current;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        node.classList.add("is-visible");
        observer.disconnect();
      }
    }, { threshold: 0.12 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return <div className={`reveal ${className}`} ref={ref}>{children}</div>;
}

function Logo({ light = false }) {
  return (
    <a className={`logo ${light ? "logo-light" : ""}`} href="/" aria-label="RouteShip home">
      <span className="logo-crop"><img src="/media/routeship-logo-transparent.png" alt="RouteShip" /></span>
    </a>
  );
}

function Header({ standalone = false }) {
  const [open, setOpen] = useState(false);
  return (
    <header className={`nav-wrap ${standalone ? "standalone" : ""}`}>
      <nav className="nav shell" aria-label="Primary navigation">
        <Logo />
        <button className="menu-button" onClick={() => setOpen(!open)} aria-label="Toggle menu" aria-expanded={open}><Icon name={open ? "close" : "menu"} /></button>
        <div className={`nav-links ${open ? "open" : ""}`}>
          <a href="/#solution" onClick={() => setOpen(false)}>Platform</a>
          <a href="/#features" onClick={() => setOpen(false)}>Features</a>
          <a href="/tracking" onClick={() => setOpen(false)}>Tracking</a>
          <a href="/rate-calculator" onClick={() => setOpen(false)}>Calculator</a>
          <a href="/#pricing" onClick={() => setOpen(false)}>Pricing</a>
          <a className="button button-small" href={CLIENT_AUTH_PATH}>Start shipping <Icon name="arrow" /></a>
        </div>
      </nav>
    </header>
  );
}

function Hero() {
  return (
    <section className="hero" id="top">
      <Header />
      <div className="hero-orbit" aria-hidden="true" />
      <WebGLScene />
      <div className="hero-widget widget-scan"><span><Icon name="scan"/></span><div><b>Parcel scanned</b><small>Mumbai hub · just now</small></div></div>
      <div className="hero-widget widget-route"><span><Icon name="truck"/></span><div><b>DEL → BLR</b><small>On time · 1,740 km</small></div></div>
      <div className="hero-widget widget-rate"><strong>₹68</strong><small>BEST LIVE RATE</small></div>
      <div className="hero-content shell">
        <div className="eyebrow"><span /> Built for ambitious commerce</div>
        <h1>Every order.<br/><em>In motion.</em></h1>
        <p className="hero-copy">RouteShip turns fragmented shipping into one fast, intelligent flow—so every parcel takes the best path from checkout to doorstep.</p>
        <div className="hero-actions">
          <a className="button" href={CLIENT_AUTH_PATH}>Ship your first order <Icon name="arrow" /></a>
          <a className="text-link" href="#solution"><span className="play"><Icon name="play" /></span> See how it flows</a>
        </div>
        <div className="hero-proof"><strong>4.9/5</strong><span>★★★★★</span><p>Loved by 2,400+ growing brands</p></div>
      </div>
      <div className="scroll-cue"><span /> SCROLL TO MOVE</div>
    </section>
  );
}

function BrandStrip() {
  return (
    <section className="brands" aria-label="Trusted brands">
      <p>CONNECTED TO INDIA'S LEADING COURIER NETWORK</p>
      <div className="brand-marquee"><div>
        <strong>DELHIVERY</strong><strong>BLUE DART</strong><strong>DTDC</strong><strong>XPRESSBEES</strong><strong>EKART</strong><strong>INDIA POST</strong>
        <strong>DELHIVERY</strong><strong>BLUE DART</strong><strong>DTDC</strong><strong>XPRESSBEES</strong><strong>EKART</strong><strong>INDIA POST</strong>
      </div></div>
    </section>
  );
}

function MomentumRail() {
  const items = ["PICKUP IN 24 HOURS", "12+ COURIER PARTNERS", "SMART RATE MATCHING", "LIVE NDR RECOVERY", "PAN-INDIA REACH"];
  return <div className="momentum-rail" aria-label="RouteShip advantages"><div>{[...items,...items].map((item,index)=><span key={`${item}-${index}`}><Icon name={index % 2 ? "truck" : "box"}/>{item}<b>↗</b></span>)}</div></div>;
}

function Problem() {
  return (
    <section className="problem editorial-dark" id="problem">
      <div className="problem-image" role="img" aria-label="A luminous parcel network crossing a dark landscape" />
      <div className="shell problem-inner">
        <Reveal className="section-kicker"><span>01</span> THE PROBLEM</Reveal>
        <Reveal><h2>Shipping grew.<br/>The systems <em>didn’t.</em></h2></Reveal>
        <div className="problem-grid">
          <Reveal><p className="lead">Too many dashboards. Hidden costs. Failed deliveries discovered too late. Growth should not make logistics feel more fragile.</p></Reveal>
          <Reveal className="stat-stack">
            <div><strong>23%</strong><p>of teams lose hours every week reconciling disconnected tools.</p></div>
            <div><strong>1 in 5</strong><p>support tickets begins with “Where is my order?”</p></div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function Solution() {
  return (
    <section className="solution section" id="solution">
      <div className="shell">
        <Reveal className="section-kicker dark"><span>02</span> THE ROUTESHIP SOLUTION</Reveal>
        <div className="solution-layout">
          <Reveal className="solution-title"><h2>One current.<br/><em>Every shipment.</em></h2><p>A single logistics control room that keeps orders moving and your team in command.</p></Reveal>
          <div className="flow-list">
            {[
              ["Connect", "Bring every order into one clean operating view."],
              ["Decide", "Select the best courier using live cost and performance."],
              ["Move", "Automate labels, pickup, tracking and exceptions."],
              ["Learn", "Turn delivery data into better decisions every week."],
            ].map(([title, text], index) => <Reveal className="flow-row" key={title}><span>0{index + 1}</span><div><h3>{title}</h3><p>{text}</p></div><i>↗</i></Reveal>)}
          </div>
        </div>
      </div>
    </section>
  );
}

function Features() {
  return (
    <section className="features section editorial-dark" id="features">
      <div className="shell">
        <Reveal className="section-kicker"><span>03</span> CORE FEATURES</Reveal>
        <Reveal className="section-head"><h2>Less busywork.<br/><em>More momentum.</em></h2><p>Everything your operations team needs, without the weight of enterprise software.</p></Reveal>
        <div className="feature-grid">
          {features.map(([num, title, text, icon]) => <Reveal className="feature-card" key={title}><div className="feature-top"><span>{num}</span><i><Icon name={icon}/></i></div><div className="feature-orb"><Icon name={icon}/></div><h3>{title}</h3><p>{text}</p><div className="feature-line" /></Reveal>)}
        </div>
      </div>
    </section>
  );
}

function Ecosystem() {
  const couriers = [
    ["Delhivery", "/partner-logos/delhivery.png"], ["Blue Dart", "/partner-logos/blue-dart.png"],
    ["DTDC", "/partner-logos/dtdc.avif"], ["Xpressbees", "/partner-logos/xpressbees.png"],
    ["Ekart", "/partner-logos/ekart.webp"], ["India Post", "/partner-logos/india-post-mark.svg"],
  ];
  const integrations = ["shopify", "Woo", "amazon", "MAGENTO", "REST API"];
  return (
    <section className="ecosystem section">
      <div className="shell">
        <Reveal className="ecosystem-copy"><div className="section-kicker dark"><span>04</span> YOUR ECOSYSTEM</div><h2>Works with the<br/><em>world you use.</em></h2><p>One connection to the partners and platforms that keep modern commerce moving.</p></Reveal>
        <Reveal className="partner-panel">
          <div className="partner-title"><span>COURIER PARTNERS</span><b>12+</b></div>
          <div className="partner-grid">{couriers.map(([name,src]) => <div key={name}><img src={src} alt={name}/><span>{name}</span></div>)}</div>
          <div className="partner-title integration-title"><span>INTEGRATIONS</span><b>30+</b></div>
          <div className="integration-row">{integrations.map((name) => <div key={name}>{name}</div>)}</div>
        </Reveal>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    ["Connect your store", "Import orders instantly or upload them in one click."],
    ["Choose the smart route", "RouteShip recommends the best courier for every promise."],
    ["Watch delivery unfold", "Track, resolve exceptions and learn from every parcel."],
  ];
  return (
    <section className="how section" id="how">
      <div className="shell">
        <Reveal className="section-head center"><div className="section-kicker dark"><span>05</span> HOW IT WORKS</div><h2>From order to doorstep<br/>in <em>three clear moves.</em></h2></Reveal>
        <div className="steps">
          {steps.map(([title, text], index) => <Reveal className="step" key={title}><div className="step-visual"><span>{index + 1}</span><div className={`step-shape shape-${index + 1}`}><Icon name="box" /></div></div><h3>{title}</h3><p>{text}</p></Reveal>)}
        </div>
      </div>
    </section>
  );
}

function Calculator() {
  const [weight, setWeight] = useState(2);
  const [zone, setZone] = useState("regional");
  const [international, setInternational] = useState(false);
  const [cod, setCod] = useState(false);
  const price = useMemo(() => {
    const base = zone === "local" ? 45 : zone === "regional" ? 68 : 94;
    const domesticRate = base + Math.max(0, weight - 0.5) * 21 + (cod ? 29 : 0);
    const internationalRate = 1299 + Math.max(0, weight - 0.5) * 420;
    return Math.round(international ? internationalRate : domesticRate);
  }, [weight, zone, cod, international]);
  return (
    <section className="calculator section editorial-dark" id="calculator">
      <div className="shell calculator-layout">
        <Reveal className="calculator-copy"><div className="section-kicker"><span>06</span> SHIPPING CALCULATOR</div><h2>Know your cost.<br/><em>Before you commit.</em></h2><p>Get an instant estimate. No hidden platform fees, no surprise line items.</p><div className="quote-note"><span>₹</span><p><strong>Transparent by design</strong><br/>Final rates depend on pincode, dimensions and selected partner.</p></div></Reveal>
        <Reveal className="calculator-card">
          <div className="calc-field"><label htmlFor="weight">Chargeable weight <b>{weight.toFixed(1)} kg</b></label><input id="weight" type="range" min="0.5" max="20" step="0.5" value={weight} onChange={(e) => setWeight(Number(e.target.value))}/><div className="range-labels"><span>0.5 kg</span><span>20 kg</span></div></div>
          <div className="calc-field"><label>Delivery zone</label><div className="segments">{[["local","Local"],["regional","Regional"],["national","National"]].map(([value,label]) => <button className={zone === value ? "active" : ""} key={value} onClick={() => setZone(value)}>{label}</button>)}</div></div>
          <label className="toggle-row"><span><strong>International shipment</strong><small>Estimate cross-border courier rates</small></span><input type="checkbox" checked={international} onChange={(e) => setInternational(e.target.checked)}/><i /></label>
          <label className="toggle-row"><span><strong>Cash on delivery</strong><small>Add COD handling</small></span><input type="checkbox" checked={cod} onChange={(e) => setCod(e.target.checked)}/><i /></label>
          <div className="estimate"><span>{international ? "ESTIMATED INTERNATIONAL RATE" : "ESTIMATED RATE"}</span><strong><small>&#8377;</small>{price}<small>/ shipment</small></strong><p>{international ? "Indicative export rate for document/parcel movement" : "Includes fuel surcharge and GST estimate"}</p></div>
          <a className="button button-full" href={CLIENT_AUTH_PATH}>Unlock this rate <Icon name="arrow" /></a>
        </Reveal>
      </div>
    </section>
  );
}

function Testimonials() {
  const stories = [
    ["RouteShip gave us the confidence to double order volume without doubling the operations team.", "ANANYA MEHTA", "CO-FOUNDER, NOURISH LABS", "2.4×", "FASTER DISPATCH", "/media/testimonial-ananya.jpg"],
    ["The NDR workflow changed our customer experience. We recover orders before they become complaints.", "ROHAN KAPOOR", "OPERATIONS, DAYBREAK", "31%", "LOWER RTO", "/media/testimonial-rohan.jpg"],
    ["For the first time, courier decisions are based on our own delivery data—not guesswork.", "SANA MIRZA", "FOUNDER, KINDRED", "18%", "LOWER COST", "/media/testimonial-sana.jpg"],
  ];
  const [active, setActive] = useState(0);
  return (
    <section className="testimonials section">
      <div className="shell testimonial-shell">
        <Reveal className="section-kicker dark"><span>07</span> CUSTOMER STORIES</Reveal>
        <div className="testimonial-stage">
          <button aria-label="Previous testimonial" onClick={() => setActive((active + stories.length - 1) % stories.length)}>←</button>
          <div key={active} className="testimonial-content"><div className="quote-mark">“</div><blockquote>{stories[active][0]}</blockquote><div className="person"><div className="avatar"><img src={stories[active][5]} alt={stories[active][1]}/></div><p><strong>{stories[active][1]}</strong><span>{stories[active][2]}</span></p></div></div>
          <div className="story-stat"><strong>{stories[active][3]}</strong><span>{stories[active][4]}</span></div>
          <button aria-label="Next testimonial" onClick={() => setActive((active + 1) % stories.length)}>→</button>
        </div>
        <div className="story-dots">{stories.map((_, index) => <button aria-label={`Show testimonial ${index + 1}`} className={active === index ? "active" : ""} onClick={() => setActive(index)} key={index}/>)}</div>
      </div>
    </section>
  );
}

function Pricing() {
  const plans = [
    ["LAUNCH", "₹0", "For new stores finding their rhythm.", ["Access to all couriers", "Branded tracking page", "Email support"], "Start for free", false],
    ["SCALE", "₹1,499", "For teams turning volume into advantage.", ["Everything in Launch", "NDR automation", "Advanced analytics", "Priority support"], "Start 14-day trial", true],
    ["ENTERPRISE", "Custom", "For complex logistics at serious scale.", ["Custom rate cards", "Dedicated success manager", "SLA & custom workflows"], "Talk to our team", false],
  ];
  return (
    <section className="pricing section editorial-dark" id="pricing">
      <div className="shell">
        <Reveal className="section-head center"><div className="section-kicker"><span>08</span> SIMPLE PRICING</div><h2>Start light.<br/><em>Scale without friction.</em></h2><p>No setup fees. No long contracts. Just the plan that matches your momentum.</p></Reveal>
        <div className="pricing-grid">{plans.map(([name, price, copy, items, cta, featured]) => <Reveal className={`price-card ${featured ? "featured" : ""}`} key={name}>{featured && <span className="popular">MOST POPULAR</span>}<p className="plan-name">{name}</p><h3>{price}<small>{price.includes("₹") ? "/ month" : ""}</small></h3><p className="plan-copy">{copy}</p><ul>{items.map(item => <li key={item}><Icon name="check"/>{item}</li>)}</ul><a className={featured ? "button button-full" : "price-link"} href={CLIENT_AUTH_PATH}>{cta} <Icon name="arrow"/></a></Reveal>)}</div>
      </div>
    </section>
  );
}

function FAQ() {
  const [open, setOpen] = useState(0);
  return (
    <section className="faq section" id="faq"><div className="shell faq-layout"><Reveal><div className="section-kicker dark"><span>09</span> FAQ</div><h2>Questions,<br/><em>meet answers.</em></h2><p>Still wondering about something?</p><a href="mailto:hello@routeship.in">Talk to a shipping expert ↗</a></Reveal><div className="faq-list">{faqs.map(([q,a], index) => <Reveal className={`faq-item ${open === index ? "open" : ""}`} key={q}><button onClick={() => setOpen(open === index ? -1 : index)} aria-expanded={open === index}><span>{q}</span><i>{open === index ? "−" : "+"}</i></button><div><p>{a}</p></div></Reveal>)}</div></div></section>
  );
}

function FinalCTA() {
  return (
    <section className="final-cta"><div className="cta-orbit one"/><div className="cta-orbit two"/><div className="shell"><Reveal><div className="eyebrow light"><span/> YOUR NEXT ORDER IS WAITING</div><h2>Move with<br/><em>momentum.</em></h2><p>Join the brands making shipping their quiet advantage.</p><a className="button button-white" href={CLIENT_AUTH_PATH}>Start shipping free <Icon name="arrow"/></a><small>No credit card · Setup in minutes · Cancel anytime</small></Reveal></div></section>
  );
}

function Footer() {
  return (
    <footer><div className="shell footer-top"><div className="footer-brand"><Logo light/><p>The intelligent shipping layer<br/>for modern Indian commerce.</p><a href="mailto:hello@routeship.in">hello@routeship.in ↗</a></div><div className="footer-links"><div><strong>PLATFORM</strong><a href="/#solution">Overview</a><a href="/tracking">Tracking</a><a href="/rate-calculator">Rate calculator</a><a href="/weight-calculator">Weight calculator</a></div><div><strong>COMPANY</strong><a href="/#problem">About</a><a href="mailto:hello@routeship.in">Careers</a><a href="/contact">Contact</a></div><div><strong>RESOURCES</strong><a href="/#faq">Help center</a><a href="/#how">Shipping guide</a><a href="mailto:hello@routeship.in">API docs</a></div></div></div><div className="shell footer-bottom"><span>© 2026 ROUTESHIP TECHNOLOGIES</span><div><a href="/">PRIVACY</a><a href="/">TERMS</a></div><a href="#top">BACK TO TOP ↑</a></div></footer>
  );
}

function LandingPage() {
  return <><Hero/><BrandStrip/><MomentumRail/><main><Problem/><Solution/><Features/><Ecosystem/><HowItWorks/><Calculator/><Testimonials/><Pricing/><FAQ/><FinalCTA/></main><Footer/></>;
}

function PageFrame({ eyebrow, title, accent, copy, children }) {
  const scene = eyebrow.includes("CALCULATOR");
  return <div className="subpage"><Header standalone/><main><section className={`page-hero ${scene ? "page-hero-scene" : ""}`}><div className="page-hero-orbit"/>{scene && <WebGLScene compact/>}<div className="shell"><div className="section-kicker dark"><span>ROUTESHIP</span>{eyebrow}</div><h1>{title}<br/><em>{accent}</em></h1><p>{copy}</p></div></section>{children}</main><Footer/></div>;
}

const trackingEvents = [
  ["Out for delivery", "Today, 08:42", "Bengaluru delivery hub", true],
  ["Reached destination hub", "Today, 05:16", "Bengaluru, Karnataka", true],
  ["In transit", "Yesterday, 19:30", "Hyderabad gateway", true],
  ["Shipment picked up", "Yesterday, 11:05", "Seller warehouse", true],
  ["Order manifested", "Yesterday, 09:24", "RouteShip network", true],
];

function TrackingPage() {
  const [value, setValue] = useState("RS78254019");
  const [query, setQuery] = useState("RS78254019");
  const [error, setError] = useState("");
  const submit = (event) => {
    event.preventDefault();
    if (value.trim().length < 8) return setError("Enter a valid RouteShip tracking ID.");
    setError("");
    setQuery(value.trim().toUpperCase());
  };
  return <PageFrame eyebrow="LIVE TRACKING" title="Follow every move." accent="Feel fully informed." copy="A calm, precise view of every milestone—from pickup to the moment your customer opens the door."><section className="page-section tracking-section"><div className="shell"><form className="tracking-search" onSubmit={submit}><label htmlFor="tracking-id">TRACKING ID</label><div><input id="tracking-id" value={value} onChange={(e) => setValue(e.target.value)} placeholder="e.g. RS78254019"/><button className="button" type="submit">Track shipment <Icon name="arrow"/></button></div>{error && <p className="form-error">{error}</p>}</form><div className="tracking-layout"><article className="shipment-card"><div className="shipment-head"><div><span>SHIPMENT</span><h2>{query}</h2></div><b>OUT FOR DELIVERY</b></div><div className="shipment-route"><div><span>FROM</span><strong>Mumbai</strong><small>400001</small></div><i><span/><span/><span/></i><div><span>TO</span><strong>Bengaluru</strong><small>560001</small></div></div><div className="delivery-promise"><span>EXPECTED DELIVERY</span><strong>Today, by 8:00 PM</strong><p>Your parcel is with the delivery partner.</p></div></article><article className="timeline-card"><h3>Journey so far</h3><div className="timeline">{trackingEvents.map(([status,time,place,done],index) => <div className={`timeline-event ${done ? "done" : ""}`} key={status}><i>{index === 0 ? <Icon name="box"/> : ""}</i><div><strong>{status}</strong><span>{time}</span><p>{place}</p></div></div>)}</div></article></div></div></section></PageFrame>;
}

function RateCalculatorPage() {
  const [form, setForm] = useState({ origin: "400001", destination: "560001", weight: 2, length: 24, width: 18, height: 12, cod: false });
  const [calculated, setCalculated] = useState(true);
  const volumetric = (form.length * form.width * form.height / 5000).toFixed(2);
  const billable = Math.max(Number(form.weight), Number(volumetric));
  const base = Math.round(54 + billable * 24 + (form.cod ? 29 : 0));
  const update = (key, value) => { setForm({ ...form, [key]: value }); setCalculated(false); };
  const couriers = [["RouteShip Select", base, "2–3 days", "BEST VALUE"],["Delhivery Surface", base + 14, "3–4 days", "RELIABLE"],["Blue Dart Air", base + 74, "1–2 days", "FASTEST"]];
  return <PageFrame eyebrow="RATE CALCULATOR" title="Clear rates." accent="Better decisions." copy="Compare delivery options using real parcel details, then choose the balance of speed and cost that works for you."><section className="page-section rate-page"><div className="shell rate-layout"><form className="page-form" onSubmit={(e) => {e.preventDefault(); setCalculated(true);}}><h3>Shipment details</h3><div className="field-grid"><label>Origin pincode<input value={form.origin} onChange={(e) => update("origin", e.target.value)}/></label><label>Destination pincode<input value={form.destination} onChange={(e) => update("destination", e.target.value)}/></label><label>Actual weight (kg)<input min="0.1" step="0.1" type="number" value={form.weight} onChange={(e) => update("weight", Number(e.target.value))}/></label><label>Length (cm)<input min="1" type="number" value={form.length} onChange={(e) => update("length", Number(e.target.value))}/></label><label>Width (cm)<input min="1" type="number" value={form.width} onChange={(e) => update("width", Number(e.target.value))}/></label><label>Height (cm)<input min="1" type="number" value={form.height} onChange={(e) => update("height", Number(e.target.value))}/></label></div><label className="toggle-row page-toggle"><span><strong>Cash on delivery</strong><small>Include COD handling in estimate</small></span><input type="checkbox" checked={form.cod} onChange={(e) => update("cod", e.target.checked)}/><i/></label><button className="button button-full" type="submit">Compare live rates <Icon name="arrow"/></button></form><div className={`rate-results ${calculated ? "ready" : "stale"}`}><div className="results-head"><div><span>RECOMMENDED OPTIONS</span><h3>{couriers.length} couriers available</h3></div><p>Billable weight <strong>{billable.toFixed(2)} kg</strong></p></div>{couriers.map(([name,price,eta,badge],index) => <article className="courier-result" key={name}><span className="courier-rank">0{index+1}</span><div><h4>{name}</h4><p>{eta} · Doorstep tracking</p></div><b>{badge}</b><strong>₹{price}</strong><button aria-label={`Select ${name}`}>→</button></article>)}{!calculated && <div className="recalc-note">Details changed—recalculate to refresh rates.</div>}</div></div></section></PageFrame>;
}

function WeightCalculatorPage() {
  const [dims, setDims] = useState({ length: 32, width: 24, height: 18, actual: 1.8 });
  const volume = dims.length * dims.width * dims.height;
  const volumetric = volume / 5000;
  const billable = Math.max(dims.actual, volumetric);
  const update = (key, value) => setDims({ ...dims, [key]: Number(value) });
  return <PageFrame eyebrow="WEIGHT CALCULATOR" title="Measure once." accent="Ship accurately." copy="See how parcel dimensions affect chargeable weight before you pack, label or promise a rate."><section className="page-section weight-page"><div className="shell weight-layout"><div className="parcel-visual"><div className="parcel-stage"><div className="parcel-box" style={{"--box-w": `${Math.min(230, 120 + dims.length * 2)}px`, "--box-h": `${Math.min(190, 90 + dims.height * 2)}px`}}><span>ROUTESHIP</span></div><div className="dimension-line horizontal">{dims.length} cm</div><div className="dimension-line vertical">{dims.height} cm</div></div><p>Live parcel visualization · Not to scale</p></div><div className="weight-controls page-form"><h3>Parcel dimensions</h3><div className="field-grid">{[["length","Length"],["width","Width"],["height","Height"]].map(([key,label]) => <label key={key}>{label} (cm)<input min="1" type="number" value={dims[key]} onChange={(e) => update(key,e.target.value)}/></label>)}<label>Actual weight (kg)<input min="0.1" step="0.1" type="number" value={dims.actual} onChange={(e) => update("actual",e.target.value)}/></label></div><div className="weight-results"><div><span>VOLUMETRIC</span><strong>{volumetric.toFixed(2)} kg</strong></div><div className="billable"><span>BILLABLE WEIGHT</span><strong>{billable.toFixed(2)} kg</strong></div></div><p className="formula">L × W × H ÷ 5000 = volumetric weight</p><a className="button button-full" href="/rate-calculator">Calculate shipping rate <Icon name="arrow"/></a></div></div></section></PageFrame>;
}

function LoginPage() {
  const [status, setStatus] = useState("");
  return <PageFrame eyebrow="OPERATIONS PORTAL" title="Welcome back." accent="Keep moving." copy="Your shipping command centre is one secure sign-in away."><section className="page-section auth-section"><div className="shell auth-layout"><aside><span>YOUR DAY, AT A GLANCE</span><h3>418</h3><p>orders moving across the RouteShip network</p><div className="mini-chart">{[45,70,52,88,64,94,78,105].map((height,index)=><i style={{height}} key={index}/>)}</div></aside><form className="page-form auth-form" onSubmit={(e)=>{e.preventDefault();setStatus("Demo access confirmed. Your dashboard is ready.");}}><h3>Sign in to RouteShip</h3><label>Work email<input required type="email" placeholder="you@company.com"/></label><label>Password<input required type="password" placeholder="••••••••"/></label><div className="form-meta"><label><input type="checkbox"/> Remember me</label><a href="mailto:hello@routeship.in">Forgot password?</a></div><button className="button button-full" type="submit">Sign in securely <Icon name="arrow"/></button>{status && <p className="form-success">{status}</p>}<p className="auth-note">New to RouteShip? <a href={CLIENT_AUTH_PATH}>Create an account</a></p></form></div></section></PageFrame>;
}

function ContactPage() {
  const [sent, setSent] = useState(false);
  return <PageFrame eyebrow="LET'S TALK" title="Your next route." accent="Starts here." copy="Tell us where your shipping operation is today. We’ll show you the clearest way forward."><section className="page-section contact-page"><div className="shell contact-layout"><div className="contact-copy"><div><span>EMAIL</span><a href="mailto:hello@routeship.in">hello@routeship.in ↗</a></div><div><span>OFFICE</span><p>Bengaluru, Karnataka<br/>Monday–Friday, 9:00–18:00</p></div><blockquote>“Good logistics should feel invisible to your customer—and completely visible to you.”</blockquote></div><form className="page-form contact-form" onSubmit={(e)=>{e.preventDefault();setSent(true);}}><div className="field-grid"><label>Your name<input required placeholder="Full name"/></label><label>Work email<input required type="email" placeholder="you@company.com"/></label><label>Monthly shipments<select defaultValue=""><option value="" disabled>Select volume</option><option>Under 500</option><option>500–2,000</option><option>2,000–10,000</option><option>10,000+</option></select></label><label>Phone<input required type="tel" placeholder="+91"/></label></div><label>What should we solve together?<textarea required rows="5" placeholder="Tell us about your shipping workflow…"/></label><button className="button button-full" type="submit">Send your message <Icon name="arrow"/></button>{sent && <p className="form-success">Thanks—our shipping team will reply within one business day.</p>}</form></div></section></PageFrame>;
}

function App() {
  const location = useLocation();
  useEffect(() => {
    const onScroll = () => document.documentElement.style.setProperty("--scroll", String(window.scrollY));
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
    if (location.hash) requestAnimationFrame(() => document.querySelector(location.hash)?.scrollIntoView());
    else window.scrollTo(0, 0);
  }, [location]);
  return <Routes><Route path="/" element={<LandingPage/>}/><Route path="/tracking" element={<TrackingPage/>}/><Route path="/rate-calculator" element={<RateCalculatorPage/>}/><Route path="/weight-calculator" element={<WeightCalculatorPage/>}/><Route path="/login" element={<LoginPage/>}/><Route path="/contact" element={<ContactPage/>}/><Route path="*" element={<Navigate to="/" replace/>}/></Routes>;
}

export default App;

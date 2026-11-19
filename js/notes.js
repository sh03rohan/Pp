/* Speaker notes — one entry per slide.
   Edit the names below to add your team members' real names. */
window.SPEAKERS = [
  { id: 1, name: "Speaker 1", topic: "Introduction" },
  { id: 2, name: "Speaker 2", topic: "Electricity & Electronics" },
  { id: 3, name: "Speaker 3", topic: "Real-World Applications" },
  { id: 4, name: "Speaker 4", topic: "Future & Conclusion" }
];

window.NOTES = [
  {
    speaker: 1,
    title: "Title Slide",
    cue: "Smile. Look at the audience. Speak slowly.",
    script:
      "Good morning, everyone. Today, our team will talk about the importance and applications of Physics in Computer Science and Engineering. We are four speakers. I will start with the basic idea. Then my friends will talk about electronics, real-world uses, and the future. Our main message is simple: computers work because of Physics."
  },
  {
    speaker: 1,
    title: "What Are Physics and CSE?",
    cue: "Point to the left card, then the right card, then the bridge in the middle.",
    script:
      "First, what is Physics? Physics is the study of energy, force, light, and matter. It explains how nature works. And what is CSE? CSE is the study of computers, software, and hardware. It helps us build smart machines and useful programs. Look at the bridge in the middle. Physics gives us the rules of nature. CSE uses these rules to build technology. So, these two subjects work together."
  },
  {
    speaker: 1,
    title: "Why Is Physics Important in CSE?",
    cue: "The four steps light up one by one. You can click a step to show it.",
    script:
      "Now, why is Physics important in CSE? Look at this computer. Every part depends on Physics. First, electricity gives power. Then, the hardware, like the processor and memory, uses that power. Next, signals carry information inside the computer and across the internet. Finally, we get computing: the result we see on the screen. Without Physics, there is no electricity, no chips, and no internet. Now, my friend will explain how electricity and electronics make this possible."
  },
  {
    speaker: 2,
    title: "Electricity Powers Computers",
    cue: "Move the voltage slider up and down while you speak.",
    script:
      "Thank you. Hello, everyone. Let's start with electricity. Electricity is the flow of tiny charged particles called electrons. Two words are very important here. Voltage is the push. Current is the flow. Think about water in a pipe. Voltage is like water pressure, and current is like the water flowing. On the screen, you can see charges moving around the circuit. When I increase the voltage, the current also increases."
  },
  {
    speaker: 2,
    title: "Transistors and Binary Numbers",
    cue: "Click the big switch to show ON and OFF. Then point to the eight switches that make the letter A.",
    script:
      "Inside every computer chip, there are transistors. A transistor is a tiny electric switch. When the switch is ON, current flows, and we call it one. When it is OFF, no current flows, and we call it zero. This is called binary. Now look at these eight switches. Together, they make one byte. Zero, one, zero, zero, zero, zero, zero, one means the letter A. A modern phone chip has billions of transistors."
  },
  {
    speaker: 2,
    title: "Digital Electronics and Logic Gates",
    cue: "Choose AND, OR, and NOT. Click input A and input B to show the output change.",
    script:
      "We can connect transistors to make logic gates. A logic gate makes a simple decision. An AND gate gives one only when both inputs are one. An OR gate gives one when any input is one. A NOT gate gives the opposite. When I change the inputs, the output changes at once. Computers use millions of these gates to do math. Now, my friend will show you how Physics helps us in real life."
  },
  {
    speaker: 3,
    title: "Fiber Optic Communication",
    cue: "Click 'Send' to send the word through the cable. You can type a new short word.",
    script:
      "Thank you. Hello, everyone. Let's see how Physics helps us in real life. First, fiber optic cables. A fiber cable is a very thin thread of glass. It sends data as flashes of light. A flash means one, and no flash means zero. The light bounces inside the glass, so it stays inside the cable. Light is very fast, so we get fast internet. Most internet data between countries travels through these cables."
  },
  {
    speaker: 3,
    title: "Wireless Communication",
    cue: "Click Wi-Fi, Bluetooth, and Mobile to show each connection.",
    script:
      "Next, wireless communication. Wi-Fi, Bluetooth, and mobile networks use electromagnetic waves. These are invisible waves of energy. They travel through the air at the speed of light. Wi-Fi connects our devices to the internet at home. Bluetooth connects devices that are very close, like earphones. Mobile networks use tall towers to cover long distances. So, we can call and send messages without any wires."
  },
  {
    speaker: 3,
    title: "Sensors and Robotics",
    cue: "Watch the robot stop near the box. You can move the box with the slider.",
    script:
      "Now, sensors and robots. A sensor helps a machine feel the world. It can detect movement, distance, light, and temperature. Look at this robot. It sends out a sound wave. The sound hits the box and comes back, like an echo. The robot measures the time and finds the distance. When the box is too close, the robot stops. Now, my friend will talk about the future of technology."
  },
  {
    speaker: 4,
    title: "Quantum Computing",
    cue: "Click 'Measure' a few times. Each time, the qubit gives 0 or 1.",
    script:
      "Thank you. Hello, everyone. Let's look at the future. First, quantum computers. A normal computer uses bits. A bit is zero or one. A quantum computer uses qubits. A qubit can be in a mix of zero and one. When we measure it, we get zero or one. Quantum computers are not faster for everything. But they can help with special problems, like designing new medicines and materials. They are still new, and many need very cold temperatures."
  },
  {
    speaker: 4,
    title: "Future Technology",
    cue: "Point to each card from left to right.",
    script:
      "Physics will also improve many other technologies. Smart robots will use better sensors and motors. Virtual Reality uses lenses and screens to create a new world around you. Augmented Reality adds digital objects to the real world through a camera. And computer chips will become smaller, faster, and use less energy."
  },
  {
    speaker: 4,
    title: "Conclusion",
    cue: "Slow down. Say the last sentence clearly. Then invite questions.",
    script:
      "To conclude, Physics is the base of Computer Science and Engineering. Electricity powers our computers. Transistors and logic gates help them think. Light and waves connect us. Sensors help machines understand the world. Physics explains how nature works, and CSE turns that knowledge into technology. Remember this: behind every great computer, there is great Physics. Thank you for listening. Do you have any questions?"
  }
];

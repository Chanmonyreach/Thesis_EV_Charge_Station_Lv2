#include <PZEM004Tv30.h>
#include <EEPROM.h>

// Define the pin to read
#define CP_FB 35
#define CP_PWM 34
#define READY_Charge_LED 26
#define Fault_LED 14
#define Charge_LED 25
#define BUZZER 33
#define POWER_RELAY 8
#define GroundDetection 32
#define Fault_PIN 27
#define set_Current_PIN 2
#define PEAK_VOLTAGE_THRESHOLD 1000

// Variables
unsigned long Oscilate = pulseIn(GroundDetection, HIGH, 50000);
unsigned long startTime = 0;
unsigned long elapsedTime = 0;
bool timerRunning = false;
int peak_voltage = 0;
int amp = 0;
unsigned long wait = 60000;

// Input and output voltage ranges
const float INPUT_MIN_V = 0.0;  // Minimum voltage of the input
const float INPUT_MAX_V = 3.3;  // Maximum voltage of the input
const float OUTPUT_MIN_V = 0.0; // Minimum voltage of the output
const float OUTPUT_MAX_V = 12.0; // Maximum voltage of the output

// State voltage ranges (mapped to 12V)
const float STATE_A_MIN_V = 3.25, STATE_A_MAX_V = 3.3; // ~12V
const float STATE_B_MIN_V = 3.2, STATE_B_MAX_V = 3.25; // ~9V
const float STATE_C_MIN_V = 2.8, STATE_C_MAX_V = 3.2;  // ~6V

// State for condition
bool buzzerActivated = false;
bool undervoltageCondition = false;  // State for undervoltage condition
bool overvoltageCondition = false;   // State for overvoltage condition
bool overCurrentCondition = false;   // State for overcurrent condition

// Use hardware serial for the PZEM
#define PZEM_RX_PIN 14
#define PZEM_TX_PIN 21

HardwareSerial PZEMSerial(1);  // UART1 for PZEM communication
PZEM004Tv30 pzem(PZEMSerial, PZEM_RX_PIN, PZEM_TX_PIN);

void setup() {
  Serial.begin(9600);           // Debugging serial
  PZEMSerial.begin(9600, SERIAL_8N1, PZEM_RX_PIN, PZEM_TX_PIN); // UART1 for PZEM

  pinMode(CP_PWM, OUTPUT);
  pinMode(READY_Charge_LED, OUTPUT);
  pinMode(Fault_LED, OUTPUT);
  pinMode(Charge_LED, OUTPUT);
  pinMode(POWER_RELAY, OUTPUT);
  pinMode(BUZZER, OUTPUT);
  pinMode(CP_FB, INPUT);

  analogWrite(CP_PWM, 255);
  digitalWrite(POWER_RELAY, LOW);
  digitalWrite(Charge_LED, HIGH);

  delay(1000);

  Checking_Earth();  // Earth connection check
  delay(1000);

  Checking_GFCI();  // GFCI check
  delay(1000);
}

void loop() {
  findPeakVoltage();  // Continuously monitor peak voltage
  Disp_Power();       // Read and display power details
}
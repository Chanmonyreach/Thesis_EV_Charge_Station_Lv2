#include <PZEM004Tv30.h>
#include <EEPROM.h>

// Define the pin to read
#define CP_FB 35
#define CP_PWM 23
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

// Threshold for each charging state
int stateA_Thres_min = 1011, stateA_Thres_max = 1023;
int stateB_Thres_min = 995, stateB_Thres_max = 1010;
int stateC_Thres_min = 875, stateC_Thres_max = 990;

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

void Disp_Power() {
  float voltage = pzem.voltage();
  float current = pzem.current();

  if (voltage <= 200) {  // Undervoltage
    OV_UV_OC_condition();
    undervoltageCondition = true;
    delay(wait);
  } else if (undervoltageCondition && voltage > 200) {
    undervoltageCondition = false;
    handleStateA();
    handleStateB();
    handleStateC();
  }

  if (voltage > 240) {  // Overvoltage
    OV_UV_OC_condition();
    overvoltageCondition = true;
    delay(wait);
  } else if (overvoltageCondition && voltage < 240) {
    overvoltageCondition = false;
    handleStateA();
    handleStateB();
    handleStateC();
  }

  if (current > 20) {  // Overcurrent
    OV_UV_OC_condition();
    overCurrentCondition = true;
    delay(wait);
  } else if (overCurrentCondition && current < 20) {
    overCurrentCondition = false;
    handleStateA();
    handleStateB();
    handleStateC();
  }
}

// Function to find peak voltage
void findPeakVoltage() {
  peak_voltage = 0;  // Reset the peak voltage
  for (int i = 0; i < 1000; i++) {
    int current_voltage = analogRead(CP_FB);  // Read the current voltage
    if (current_voltage > peak_voltage) {
      peak_voltage = current_voltage;  // Update the peak voltage if current reading is higher
    }
  }
}

// State Handlers
void handleStateA() {
  if (digitalRead(Fault_PIN) == 1) {
    GFCI_selftest();
  } else {
    pzem.resetEnergy();
    amp = EEPROM.read(0);

    if (digitalRead(set_Current_PIN) == 0) {
      digitalWrite(BUZZER, 1);
      delay(50);
      buzzerActivated = false;
      if (amp < 15) {
        amp += 3;  // Increase by 3
      } else if (amp < 16) {
        amp += 1;  // Increase by 1 when amp reaches 15
      } else {
        amp = 6;  // Reset to 6 when it goes beyond 16
      }
      EEPROM.write(0, amp);  // Store updated amp value in EEPROM
    }

    analogWrite(CP_PWM, 255);
    digitalWrite(Charge_LED, HIGH);
    digitalWrite(Fault_LED, LOW);
    digitalWrite(READY_Charge_LED, HIGH);
    digitalWrite(BUZZER, LOW);
    digitalWrite(POWER_RELAY, LOW);
    buzzerActivated = false;
  }
}

void handleStateB() {
  digitalWrite(POWER_RELAY, LOW);
  analogWrite(CP_PWM, 22 + ((255 * (amp / 0.6)) / 100));
  digitalWrite(Charge_LED, HIGH);
  digitalWrite(Fault_LED, LOW);
  digitalWrite(READY_Charge_LED, HIGH);
  digitalWrite(BUZZER, LOW);
  buzzerActivated = false;
}

void handleStateC() {
  digitalWrite(POWER_RELAY, HIGH);
  analogWrite(CP_PWM, 22 + ((255 * (amp / 0.6)) / 100));
  digitalWrite(Charge_LED, LOW);
  digitalWrite(Fault_LED, LOW);
  digitalWrite(READY_Charge_LED, HIGH);
  if (!buzzerActivated) {
    digitalWrite(BUZZER, HIGH);
    delay(500);  // Short delay for buzzer
    digitalWrite(BUZZER, LOW);
    buzzerActivated = true;  // Set buzzer flag to prevent reactivation
  }
  while (peak_voltage >= stateC_Thres_min && peak_voltage < stateC_Thres_max) {
    findPeakVoltage();  // Update the peak voltage

    if (!timerRunning) {
      startTime = millis() - elapsedTime;
      timerRunning = true;
    }

    if (millis() - startTime >= 60000) {
      elapsedTime = millis() - startTime;
    }
  }
}

void Checking_GFCI() {
  if (digitalRead(Fault_PIN) == 1) {
    digitalWrite(Charge_LED, LOW);
    analogWrite(CP_PWM, 255);
    digitalWrite(READY_Charge_LED, LOW);
    digitalWrite(POWER_RELAY, LOW);
    digitalWrite(Fault_LED, HIGH);
    digitalWrite(BUZZER, HIGH);
    delay(50);
    digitalWrite(BUZZER, LOW);
    digitalWrite(Fault_LED, LOW);
    delay(50);
    buzzerActivated = false;
  }
}

void GFCI_selftest() {
  analogWrite(CP_PWM, 255);
  digitalWrite(Charge_LED, LOW);
  digitalWrite(READY_Charge_LED, LOW);
  digitalWrite(POWER_RELAY, LOW);
  digitalWrite(Fault_LED, HIGH);
  digitalWrite(BUZZER, HIGH);
  delay(100);
  digitalWrite(BUZZER, LOW);
  digitalWrite(Fault_LED, LOW);
  delay(100);
  buzzerActivated = false;
}

void OV_UV_OC_condition() {
  analogWrite(CP_PWM, 255);
  digitalWrite(POWER_RELAY, LOW);
  digitalWrite(READY_Charge_LED, LOW);
  digitalWrite(Charge_LED, LOW);
  digitalWrite(Fault_LED, HIGH);
  digitalWrite(BUZZER, HIGH);
  delay(100);
  digitalWrite(Fault_LED, LOW);
  digitalWrite(BUZZER, LOW);
  delay(100);
  buzzerActivated = false;  // Reset buzzer flag
}

void Checking_Earth() {
  if (Oscilate > 100) {  // Earth pin oscillation detected
    delay(1000);
  } else {
    // No earth detected
    analogWrite(CP_PWM, 255);
    digitalWrite(Charge_LED, LOW);
    digitalWrite(READY_Charge_LED, LOW);
    digitalWrite(Fault_LED, HIGH);
    digitalWrite(BUZZER, HIGH);
    delay(300);
    digitalWrite(Fault_LED, LOW);
    digitalWrite(BUZZER, LOW);
    delay(300);
    buzzerActivated = false;  // Reset buzzer flag
  }
}

// Define the pins
#define CP_FB 35   // Control Pilot feedback pin
#define CP_PWM 23  // Control Pilot PWM output pin
#define READY_Charge_LED 26
#define Fault_LED 2
#define Floot_LED 14
#define Charge_LED 25
#define BUZZER 33
#define POWER_RELAY 12

const int pwmChannel = 0;
const int pwmFrequency = 1000;  // Control Pilot signal should be 1kHz
const int pwmResolution = 8;    // 8-bit resolution (0-255)

// Thresholds for Control Pilot states on ESP32 (scaled for 12-bit ADC)
const int stateThresholds[][2] = {
  { 4044, 4095 },  // State A
  { 3980, 4040 },  // State B
  { 3500, 3960 }   // State C
};

// Variables
const int stationMaxCurrent = 32;  // Max current supply by station
const float gridMaxCurrent = 5;    // Max current supply by Grid
float limitCurrent = 40;           // Initial current setting
int peakVoltage = 0;
bool buzzerActivated = false;

void setup() {
  Serial.begin(115200);
  analogReadResolution(12);
  analogSetAttenuation(ADC_11db);

  ledcAttachChannel(CP_PWM, pwmFrequency, pwmResolution, pwmChannel);
  pinMode(CP_FB, INPUT);
  pinMode(READY_Charge_LED, OUTPUT);
  pinMode(Fault_LED, OUTPUT);
  pinMode(Floot_LED, OUTPUT);
  pinMode(Charge_LED, OUTPUT);
  pinMode(POWER_RELAY, OUTPUT);
  pinMode(BUZZER, OUTPUT);

  limitCurrent = min(limitCurrent, min(gridMaxCurrent, (float)stationMaxCurrent));
  ledcWriteChannel(pwmChannel, currentToDutyCycle(limitCurrent));
  resetOutputs();
}

void resetOutputs() {
  digitalWrite(POWER_RELAY, LOW);
  digitalWrite(Charge_LED, LOW);
  digitalWrite(READY_Charge_LED, LOW);
  digitalWrite(Fault_LED, LOW);
  digitalWrite(Floot_LED, LOW);
  digitalWrite(BUZZER, LOW);
}

void findPeakVoltage() {
  peakVoltage = 0;
  for (int i = 0; i < 1000; i++) {
    peakVoltage = max(peakVoltage, (int)analogRead(CP_FB));
  }
}

float currentToDutyCycle(float current) {
  if (current < 51) return (current / 0.6) * 255 / 100;
  if (current < 80) return ((current / 2.5) + 64) * 255 / 100;
  return 255;  // Max duty cycle
}

void updateLEDs(int state) {
  resetOutputs();
  switch (state) {
    case 1: digitalWrite(Floot_LED, HIGH); break;
    case 2: digitalWrite(READY_Charge_LED, HIGH); break;
    case 3: digitalWrite(Charge_LED, HIGH); break;
    case -1: digitalWrite(Fault_LED, HIGH); break;
  }
}

void handleControlPilotState() {
  if (peakVoltage >= stateThresholds[0][0] && peakVoltage <= stateThresholds[0][1]) {
    digitalWrite(POWER_RELAY, LOW);
    buzzerActivated = false;
    updateLEDs(1);
  } else if (peakVoltage >= stateThresholds[1][0] && peakVoltage <= stateThresholds[1][1]) {
    digitalWrite(POWER_RELAY, LOW);
    buzzerActivated = false;
    updateLEDs(2);
  } else if (peakVoltage >= stateThresholds[2][0] && peakVoltage <= stateThresholds[2][1]) {
    digitalWrite(POWER_RELAY, HIGH);
    if (!buzzerActivated) {
      Serial.println("Buzzer Triggered!");
      digitalWrite(BUZZER, HIGH);
      delay(500);
      digitalWrite(BUZZER, LOW);
      buzzerActivated = true;
    }
    updateLEDs(3);
  } else {
     analogWrite(CP_PWM, 255);
    if (!buzzerActivated) {
      Serial.println("Fault - Buzzer Triggered!");
      digitalWrite(BUZZER, HIGH);
      delay(500);
      digitalWrite(BUZZER, LOW);
      buzzerActivated = true;
      updateLEDs(-1);
    }
  }
}

void loop() {
  findPeakVoltage();
  ledcWriteChannel(pwmChannel, currentToDutyCycle(limitCurrent));
  handleControlPilotState();
  Serial.printf("CP_PWM: %d\tPeak Voltage: %d\tCP_FB: %d\n", CP_PWM, peakVoltage, CP_FB);
}


// Define the pins
#define CP_FB 35   // Control Pilot feedback pin
#define CP_PWM 23  // Control Pilot PWM output pin
#define READY_Charge_LED 26
#define Fault_LED 2
#define Floot_LED 14
#define Charge_LED 25
#define BUZZER 33
#define POWER_RELAY 12

// Thresholds for Control Pilot states on ESP32 (scaled for 12-bit ADC)
int stateA_Thres_min = 4044, stateA_Thres_max = 4095;
int stateB_Thres_min = 3980, stateB_Thres_max = 4040;
int stateC_Thres_min = 3500, stateC_Thres_max = 3960;

// Variables
int stationmaxiCurrent = 32; // maximum current supply by station
float GridmaxiCurrent = 5; // maximum current supply by Grid
float LimitCurrent = 40;  // Initial current setting
float dutyCycle = 0;
int peak_voltage = 0;
bool buzzerActivated = false;

unsigned long previousMillis = 0;  // Store the last time the peak voltage was updated
const long interval = 1000;        // Interval to update the peak voltage (1 second)
unsigned long lastPrintTime = 0;   // Store the last time a print occurred

void setup() {
  Serial.begin(115200);
  analogReadResolution(12);        // Set ADC resolution to 12 bits
  analogSetAttenuation(ADC_11db);  // Set attenuation for a range of 0–3.3V

  pinMode(CP_FB, INPUT);
  pinMode(CP_PWM, OUTPUT);
  pinMode(READY_Charge_LED, OUTPUT);
  pinMode(Fault_LED, OUTPUT);
  pinMode(Floot_LED, OUTPUT);
  pinMode(Charge_LED, OUTPUT);
  pinMode(POWER_RELAY, OUTPUT);
  pinMode(BUZZER, OUTPUT);

  // Initialize outputs
  analogWrite(CP_PWM, currentToDutyCycle(LimitCurrent));
  digitalWrite(POWER_RELAY, LOW);
  digitalWrite(Charge_LED, LOW);
  digitalWrite(READY_Charge_LED, LOW);
  digitalWrite(Fault_LED, LOW);
  digitalWrite(Floot_LED, LOW);
  digitalWrite(BUZZER, LOW);

    if (LimitCurrent >= GridmaxiCurrent){
    LimitCurrent = GridmaxiCurrent;
  }

  if (LimitCurrent >= stationmaxiCurrent){
    LimitCurrent = stationmaxiCurrent;
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
// Function to find peak current
void findPeakCurrent() {
  dutyCycle = currentToDutyCycle(LimitCurrent);
  analogWrite(CP_PWM, dutyCycle);
}

void updateLEDs(int state) {
  // Reset all LEDs to a default state
  digitalWrite(Charge_LED, LOW);
  digitalWrite(Fault_LED, LOW);
  digitalWrite(READY_Charge_LED, LOW);
  digitalWrite(Floot_LED, LOW);

  // Control LEDs based on the state
  switch (state) {
    case 1:  // State A
      digitalWrite(Floot_LED, HIGH);
      break;
    case 2:  // State B
      digitalWrite(READY_Charge_LED, HIGH);
      break;
    case 3:  // State C
      digitalWrite(Charge_LED, HIGH);
      break;
    case -1:  // Fault State
      digitalWrite(Fault_LED, HIGH);
      break;
    default:
      break;
  }
}

// Function to map current (in Amps) to duty cycle percentage
float currentToDutyCycle(float current) {
  float D = 0;
  float PWM = 0;
  if (current <51){
    D =  current/0.6;
  }
    if (current >= 51 && current <80){
    D =  (current/2.5)+64;
  }

  PWM = D * 255/100;
  return PWM;
}


void handleStateA() {
  digitalWrite(POWER_RELAY, LOW);
  digitalWrite(BUZZER, LOW);
  buzzerActivated = false;
  updateLEDs(1);  // Update LEDs for State A
}

void handleStateB() {
  digitalWrite(POWER_RELAY, LOW);
  digitalWrite(BUZZER, LOW);
  buzzerActivated = false;
  updateLEDs(2);  // Update LEDs for State B
}

void handleStateC() {
  digitalWrite(POWER_RELAY, HIGH);
  if (!buzzerActivated) {
    Serial.println("Buzzer Triggered!");
    digitalWrite(BUZZER, HIGH);
    delay(500);
    digitalWrite(BUZZER, LOW);
    buzzerActivated = true;
  }
  updateLEDs(3);  // Update LEDs for State C
}

void handleControlPilotState(int peak_voltage) {
  if (peak_voltage >= stateA_Thres_min && peak_voltage <= stateA_Thres_max) {
    handleStateA();  // Handle State A
  } else if (peak_voltage >= stateB_Thres_min && peak_voltage <= stateB_Thres_max) {
    handleStateB();  // Handle State B
  } else if (peak_voltage >= stateC_Thres_min && peak_voltage <= stateC_Thres_max) {
    handleStateC();  // Handle State C
  } else {
    // Fault condition or undefined state
    analogWrite(CP_PWM, 255);
    if (!buzzerActivated) {
      Serial.println("Fault - Buzzer Triggered!");  // Debug print for fault condition
      digitalWrite(BUZZER, HIGH);
      delay(500);
      digitalWrite(BUZZER, LOW);
      buzzerActivated = true;
      updateLEDs(-1);  // Update LEDs for Fault State
    }
  }
}


void loop() {
  findPeakVoltage();  // Continuously find the peak voltage
  findPeakCurrent();
  handleControlPilotState(peak_voltage);  // Handle the control pilot state based on updated peak voltage

  // Output data for Serial Plotter
  Serial.print(peak_voltage);  // First value: peak voltage
  Serial.print("\t");          // Tab separates multiple values
  Serial.println(CP_FB);     // Second value: duty cycle

}

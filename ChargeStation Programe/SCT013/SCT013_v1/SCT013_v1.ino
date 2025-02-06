#define SENSOR_PIN 34  // ADC pin for SCT013-100A
const float VREF = 3.3;  // ESP32 ADC reference voltage
const int ADC_MAX = 4095;  // 12-bit ADC resolution
const float BURDEN_RESISTOR = 10.0;  // Burden resistor value in ohms
const float CT_RATIO = 100.0;  // 100A:50mA (output current ratio)

// Read AC signal
float readCurrent() {
    int sampleCount = 1000;  // Number of samples
    float sum = 0;

    for (int i = 0; i < sampleCount; i++) {
        int adcValue = analogRead(SENSOR_PIN);
        float voltage = (adcValue / (float)ADC_MAX) * VREF;
        float current = (voltage / BURDEN_RESISTOR) * CT_RATIO;
        sum += current * current;  // RMS calculation
        delayMicroseconds(100);  // Sampling delay
    }

    float rmsCurrent = sqrt(sum / sampleCount);
    return rmsCurrent;
}

void setup() {
    Serial.begin(115200);
    pinMode(SENSOR_PIN, INPUT);
}

void loop() {
    float current = readCurrent();
    Serial.print("Current: ");
    Serial.print(current,4);
    Serial.println(" A");
    delay(100);
}

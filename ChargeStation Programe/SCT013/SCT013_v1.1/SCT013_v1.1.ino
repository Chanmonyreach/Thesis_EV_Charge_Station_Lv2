#include "Arduino.h"

#define ADC_PIN 34             // ESP32 ADC1 GPIO34 (Use ADC1 pins only)
#define SAMPLES 1000           // Number of ADC samples per cycle
#define ADC_REF_VOLT 3.3       // ESP32 ADC reference voltage
#define ADC_RES 4095.0         // 12-bit ADC resolution
#define BURDEN_RESISTOR 10.0   // Burden resistor value in ohms
#define CT_TURNS 2000          // Number of turns in SCT-013

#define CURRENT_THRESHOLD 0.5  // Set a threshold for current detection (e.g., 0.5A)

void currentDetectionTask(void *pvParameters);

void setup() {
    Serial.begin(115200);
    delay(1000);

    // Create a FreeRTOS task for current detection
    xTaskCreate(
        currentDetectionTask,  // Task function
        "CurrentDetection",    // Task name
        2048,                  // Stack size
        NULL,                  // Task parameters
        1,                     // Priority
        NULL                   // Task handle
    );
}

void loop() {
    // Empty since FreeRTOS manages tasks
}

// FreeRTOS Task for Current Measurement
void currentDetectionTask(void *pvParameters) {
    while (1) {
        float voltagePeakToPeak = 0.0;
        float minVal = ADC_RES, maxVal = 0.0;

        // Sample ADC multiple times to capture peaks
        for (int i = 0; i < SAMPLES; i++) {
            int adcVal = analogRead(ADC_PIN);
            if (adcVal > maxVal) maxVal = adcVal;
            if (adcVal < minVal) minVal = adcVal;
            delayMicroseconds(100); // Sampling delay
        }

        voltagePeakToPeak = (maxVal - minVal) * (ADC_REF_VOLT / ADC_RES);  // Convert ADC to voltage
        float voltageRMS = voltagePeakToPeak / (2.0 * sqrt(2));  // Convert peak-to-peak to RMS
        float currentRMS = voltageRMS / BURDEN_RESISTOR * CT_TURNS; // Convert voltage to current

        // **Trigger detection if current exceeds threshold**
        if (currentRMS > CURRENT_THRESHOLD) {
            Serial.print("Current detected: ");
            Serial.print(currentRMS, 3);
            Serial.println(" A");
        }

        vTaskDelay(pdMS_TO_TICKS(100)); // Wait 1 second before next detection
    }
}

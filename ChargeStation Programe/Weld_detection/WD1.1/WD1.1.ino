#define Weld_pin 4  // Ensure this is a valid digital input pin

void readWeldTask(void *pvParameters) {
    while (1) {
        int Weld = digitalRead(Weld_pin);  // Read signal
        Serial.println(Weld);
        vTaskDelay(pdMS_TO_TICKS(10));  // Sample at 100Hz (every 10ms)
    }
}

void setup() {
    Serial.begin(115200);
    pinMode(Weld_pin, INPUT);  // Set as input

    // Create FreeRTOS task
    xTaskCreate(
        readWeldTask,  // Task function
        "Weld Reader", // Task name
        1000,          // Stack size (in words)
        NULL,          // Task parameters
        1,             // Priority (higher = more priority)
        NULL           // Task handle (optional)
    );
}

void loop() {
    // Empty loop as FreeRTOS handles tasks
}

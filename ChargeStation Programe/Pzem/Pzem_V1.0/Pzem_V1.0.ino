#include <PZEM004Tv30.h>
#include <HardwareSerial.h>

// Define the UART pins for communication
#define PZEM_RX_PIN 22  // ESP32 RX (Connect to PZEM TX)
#define PZEM_TX_PIN 21  // ESP32 TX (Connect to PZEM RX)

// Use HardwareSerial (ESP32 has multiple UARTs)
HardwareSerial pzemSerial(1);
PZEM004Tv30 pzem(pzemSerial, PZEM_RX_PIN, PZEM_TX_PIN);

void setup() {
    Serial.begin(115200); // Start Serial Monitor
    delay(1000);
    Serial.println("PZEM-004T V3 Test with ESP32");
}

void loop() {
    float voltage = pzem.voltage();
    float current = pzem.current();
    float power = pzem.power();
    float energy = pzem.energy();
    float frequency = pzem.frequency();
    float pf = pzem.pf();

    Serial.print("Voltage: "); Serial.print(voltage); Serial.println("V");
    Serial.print("Current: "); Serial.print(current); Serial.println("A");
    Serial.print("Power: "); Serial.print(power); Serial.println("W");
    Serial.print("Energy: "); Serial.print(energy); Serial.println("kWh");
    Serial.print("Frequency: "); Serial.print(frequency); Serial.println("Hz");
    Serial.print("Power Factor: "); Serial.print(pf); Serial.println();
    Serial.println("-----------------------------------");

    delay(2000); // Wait before next reading
}

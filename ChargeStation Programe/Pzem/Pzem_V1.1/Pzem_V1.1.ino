#include <PZEM004Tv30.h>

// Define Serial pins (RX2 = GPIO22, TX2 = GPIO21)
HardwareSerial pzemSerial(2);
PZEM004Tv30 pzem(pzemSerial, 22, 21);  // RX, TX

void setup() {
    Serial.begin(115200);
    pzemSerial.begin(9600, SERIAL_8N1, 22, 21);  // Baud rate and pins
}

void loop() {
    float voltage = pzem.voltage();
    float current = pzem.current();
    float power = pzem.power();
    float energy = pzem.energy();
    float frequency = pzem.frequency();
    float pf = pzem.pf();  // Power Factor

    if (voltage != NAN) {
        Serial.print("Voltage: "); Serial.print(voltage,5); Serial.println("V");
        Serial.print("Current: "); Serial.print(current,5); Serial.println("A");
        Serial.print("Power: "); Serial.print(power,5); Serial.println("W");
        Serial.print("Energy: "); Serial.print(energy,5); Serial.println("kWh");
        Serial.print("Frequency: "); Serial.print(frequency,5); Serial.println("Hz");
        Serial.print("Power Factor: "); Serial.print(pf,5); Serial.println();
        Serial.println("------------------------");
    } else {
        Serial.println("Error reading PZEM data.");
    }

    delay(100);
}

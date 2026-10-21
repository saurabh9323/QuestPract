export const languageBasics={
 C:String.raw`#include <stdio.h>
int main(void) {
  int values[] = {2, 4, 6};
  int total = 0;
  for (int i = 0; i < 3; i++) total += values[i];
  printf("%d\n", total); // 12
  return 0;
}`,
 'C++':String.raw`#include <iostream>
#include <vector>
int main() {
  std::vector<int> values{2, 4, 6};
  int total = 0;
  for (int value : values) total += value;
  std::cout << total << "\n"; // 12
}`,
 JavaScript:`const values = [2, 4, 6];
let total = 0;
for (const value of values) total += value;
console.log(total); // 12`,
 Java:`class Main {
  public static void main(String[] args) {
    int[] values = {2, 4, 6};
    int total = 0;
    for (int value : values) total += value;
    System.out.println(total); // 12
  }
}`,
 Python:`values = [2, 4, 6]
total = 0
for value in values:
    total += value
print(total)  # 12`
};
export const languageNotes={C:'Arrays do not carry their length into functions; pass a length. Pointer arithmetic and memory ownership require care.', 'C++':'vector tracks its size. unordered_map and unordered_set provide hash-based lookup; map and set are ordered tree-based containers.',JavaScript:'Array is dynamic. Map stores key/value pairs and Set stores membership. Bitwise operators convert numbers to 32-bit integers.',Java:'Arrays have fixed length; ArrayList grows. HashMap and HashSet use reference types such as Integer for generic values.',Python:'Lists are dynamic sequences; dict maps keys to values and set tracks membership. Integers can grow beyond fixed machine word size.'};

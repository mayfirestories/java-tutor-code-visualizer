# Java Code Visualizer & Stepper

A browser-based, interactive Java execution and memory visualizer clone of Python Tutor. It runs Java code directly in your browser using an embedded, zero-dependency Java interpreter and execution tracer written in JavaScript.

---

## Features

- **Real-Time Client-Side Java Execution**:
  - Full Java syntax support: classes, constructors, methods (`public static void main(String[] args)` or helper methods), instance methods, recursion, and loose top-level statements.
  - Rich control flow: standard 3-part `for` loops, enhanced for-each loops (`for (Type x : iterable)`), `while`, `do-while`, `if`/`else`, classic and arrow `switch` (`case` / `default`, fall-through, `break`, and `yield`), `break`, `continue`, and `return`.
  - Data structures & collections: 1D and 2D primitive/reference arrays (`int[]`, `String[]`), `ArrayList<E>`, `HashMap<K, V>`, `HashSet<E>`, `ArrayDeque<E>`, and `StringBuilder`.
  - Built-in utilities: `System.out.println` / `print` / `printf`, `Math` (`max`, `min`, `abs`, `pow`, `sqrt`, `random`), `Arrays.toString` / `sort` / `fill`, `String` (including `length`, `charAt`, `substring`, `equals`, `split`, `replace`, `format`, and `join`), `Integer` / `Long` / `Double` / `Boolean` / `Character`, `java.util.Random` (same sequence as Java for a given seed), and `Scanner` over a `String` or `System.in`.
  - **Program input** box: text typed there is what `Scanner(System.in)` and `System.in` read. `new Scanner("...")` reads that string instead.
- **Multi-Tab File Manager**:
  - Starts with `Tab 1`.
  - Click the **`+`** button to open additional tabs (`Tab 2`, `Tab 3`, etc.).
  - Click **`×`** to close a tab (active when 2 or more tabs are open).
  - Each tab keeps its own independent code, execution trace, step index, and console output.
- **Interactive Execution Stepper**:
  - **`Next line →`** & **`← Previous`**: Step statement by statement through Java code execution.
  - **`Next loop iteration ⟳`**: Jump directly to the next pass of the active loop.
  - **`First`** & **`Last`**: Instantly jump to the start or end of the trace.
  - **Scrubber Slider**: Scrub directly to any execution step.
- **Memory Visualizer**:
  - **Frames**: Displays call stack frames (e.g. `Main.main`, `Person`, recursive calls) with active local variables.
  - **Objects**: Visualizes arrays, `ArrayList`s, `HashMap`s, and custom class instances on the heap, labeled with their variable names (e.g. `students`, `sol`) instead of raw hex pointers.
- **Full-Width Responsive Dark UI**: Stretches across modern monitors with responsive split-pane layout for code and memory inspection.

---

## Prerequisites

To run the application locally, you only need Python 3 installed (used simply to serve static files over HTTP).

Verify Python is installed:

```bash
python --version
```

---

## How to Setup and Run Locally

### Option 1: Using Python's Built-in HTTP Server (Recommended)

1. Open your terminal or PowerShell and navigate into the `java-tutor` directory:

   ```bash
   cd java-tutor
   ```

2. Start a local HTTP server on port 8001:

   **Windows (PowerShell or Command Prompt):**
   ```powershell
   python -m http.server 8001
   ```

   **macOS / Linux:**
   ```bash
   python3 -m http.server 8001
   ```

   > **Note**: Use a different port than the Python tutor (which uses 8000). Both tutors use the same file names, so if they share a port the browser can load the cached Python tutor instead of this one. If that happens, press `Ctrl + F5` to force a full reload.

3. Open your browser and visit:

   [http://localhost:8001](http://localhost:8001)

4. Press `Ctrl + C` in the terminal when you want to stop the server.

---

### Option 2: Using VS Code / Cursor Live Server Extension

If you use VS Code or Cursor:

1. Install the **Live Server** extension (by Ritwick Dey).
2. Right-click `java-tutor/index.html` in the file explorer.
3. Select **Open with Live Server**.

---

## Project Structure

```
java-tutor/
├── index.html        # Main HTML layout (Tabs, Stepper, Frames, Heap, Console)
├── style.css         # Full-width dark theme responsive stylesheet
├── script.js         # Java Lexer, Parser, Interpreter, Tracer, and UI logic
├── .gitignore        # Git ignore rules for OS and editor artifacts
└── README.md         # Documentation and setup instructions
```

---

## Example Java Code to Try

### 1. Loop and Array

```java
public class Main {
    public static void main(String[] args) {
        String[] students = {"Bob", "Alice", "Norb"};
        for (String s : students) {
            System.out.println("Hello " + s);
        }
    }
}
```

### 2. Custom Class & Instance Fields

```java
class Person {
    String name;
    int age;

    Person(String name, int age) {
        this.name = name;
        this.age = age;
    }
}

public class Main {
    public static void main(String[] args) {
        Person p = new Person("Alice", 25);
        System.out.println(p.name + " is " + p.age + " years old.");
    }
}
```

### 3. Recursion (Multiple Stack Frames)

```java
public class Main {
    public static int factorial(int n) {
        if (n <= 1) return 1;
        return n * factorial(n - 1);
    }

    public static void main(String[] args) {
        int result = factorial(4);
        System.out.println("4! = " + result);
    }
}
```

### 4. LeetCode 1700 Simulation (Array Frequency Count)

```java
class Solution {
    public int countStudents(int[] students, int[] sandwiches) {
        int[] counts = new int[2];
        for (int student : students) {
            counts[student]++;
        }

        int remaining = sandwiches.length;
        for (int sandwich : sandwiches) {
            if (counts[sandwich] == 0) {
                break;
            }
            counts[sandwich]--;
            remaining--;
        }
        return remaining;
    }
}

public class Main {
    public static void main(String[] args) {
        int[] students = {1, 1, 0, 0};
        int[] sandwiches = {0, 1, 0, 1};
        Solution sol = new Solution();
        int unable = sol.countStudents(students, sandwiches);
        System.out.println("Students unable to eat: " + unable);
    }
}
```

### 5. Switch, Scanner, and Random

Put this in **Program input** before running:

```text
2
Ada
```

```java
import java.util.Scanner;
import java.util.Random;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        String name = in.next();

        String label = switch (n) {
            case 1 -> "one";
            case 2, 3 -> "a few";
            default -> "many";
        };

        Random rand = new Random(42);
        int roll = rand.nextInt(6) + 1;
        System.out.printf("%s rolled %d (%s)%n", name, roll, label);
        System.out.println(name.toUpperCase());
    }
}
```

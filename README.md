# M5: Distributed Execution Engine
> Full name: `Amin Hijaz`
> Email:  `amin_hijaz@brown.edu`
> Username:  `ahijaz`

## Summary
> Summarize your implementation, including key challenges you encountered

My implementation comprises `2` new software components, totaling `321` added lines of code over the previous implementation. Key challenges included `notify was tricky to do, I have decided to create a listener route on the main node and a notify function as part of mr+id service on all other nodes, and the listener keeps counter of the three services. Output format between pahses was tricky too but I had a callback in each function to see the connection by logging the process. Using store and mem is tricky too`.

## Correctness & Performance Characterization
> Describe how you characterized the correctness and performance of your implementation

*Correctness*: I have ran the tests in mr.js test, moreover, I have implemented multiple workflows and my implmentition work with them as expected. For extra feautres i edited the mr.test.js to take in memory = true, count, and compact and it worked as expected.

*Performance*: it takes 1.378 s to run mr.test.js with npm test with all other tests commented.

## Key Feature
> Which extra features did you implement and how?
As part of capstone requirment I implemented In-memory operation by using .mem instead of .store if memory = true.
Implemented Iterative MapReduce by keep running the mapping fn on output till the count is zero in the map function.
Implemented compact which is a function that takes an array of key-values representing the output of mapReduce and return a new array. I called this function on the MapRes after the node is done mapping. Each node call it once. I also implemented all the workflows in all.student.test.js
## Time to Complete 
> Roughly, how many hours did this milestone take you to complete?

Hours: `11`


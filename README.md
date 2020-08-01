# node-red-contrib-homereru

Collection of nodes for homeautomation and simple online asset health checking
Basically portion of this module is mish-mash from other nodes with some (subjective) adjustments
So it's usable for my small server + home automation use-case

The mish-mash since I cannot `inherit` the original module and do override, while
contributing PR to those module will kind of ruin their use-case

# Nodes

## Passer
- Change Pass : Only pass to next node if the value is changed (there's decay on changed delta)
- Day Pass : Only pass to next node if the day is within specified days
- Time Pass : Only pass to next node if the time is within time range
- Range Pass : Only pass to next node if the value is within value range
- File Pass : Only pass to next node - if the specified file exists
- Limit pass : Only pass to next node - only if the message interval is within rate limit

## Emitterio

## Format
- Date Locale : Date formatter
- String Command : String parser for query string, chat command and split string

## Network
- IP Public : Get your public IP
- HTTPS Eval : Do HTTPS request, and return the `cert` information as JSON

# Icons
Sanscons - CCSA 3.0 from http://somerandomdude.com/work/sanscons/

# Modules
node-red-contrib-moment
https://github.com/totallyinformation/node-red-contrib-moment

norelite
https://github.com/nidayand/norelite

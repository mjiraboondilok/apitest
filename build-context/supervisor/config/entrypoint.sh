#!/bin/bash
set -e -u

# default parameters for supervisord
SUPERVISOR_PARAMS='-c /etc/supervisord.conf'

export PS1='\u@\h:\w\$ '

# run supervisord detached...
supervisord $SUPERVISOR_PARAMS

# wait until unoserver started and listens on port 2002.
echo "Waiting for unoserver to start ..."
COUNTER=0
while [ -z "`netstat -tln | grep 2003`" ]; do
  COUNTER=$(( COUNTER + 1 ))
  if (( $COUNTER > 30 )); then
    COUNTER=0
    echo "waited too long for unoserver to start - restarting"
    supervisorctl restart unoserver
  fi
  sleep 1
done
echo "unoserver started."
netstat -tln | grep 2003
unoconvert --version
libreoffice --version

# start the app
supervisorctl start app

# wait until app started and listens on port 8080.
echo "Waiting for app to start ..."
while [ -z "`netstat -tln | grep 8080`" ]; do
  sleep 1
done
echo "app started."

# if commands have been passed to container run them and exit, else start bash
if [[ $@ ]]; then
  eval $@
else
  tail -f /dev/null
fi
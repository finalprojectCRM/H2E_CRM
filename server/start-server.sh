forever stop CRM-Server.js

rm -f ~/.forever/crm.log

forever -l crm.log -o crm.log -e crm.log start CRM-Server.js

tail -f  ~/.forever/crm.log -s 1
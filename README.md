Iquidus Explorer - 1.7.4
================

An open source block explorer written in node.js.

### See it in action

*  [List of live explorers running Iquidus](https://github.com/iquidus/explorer/wiki/Live-Explorers)
*  most of the information comes from https://stakeandnodes.net/iquidus-explorer-installation-guide/ , but with some tweaks I found easier 
*  https://github.com/go140point6/pvpcoin-explorer#fix-for-length-undefined this link has some fixes that are already implemented in this code 

*Note: If you would like your instance mentioned here contact me*

### Requires

*  node.js >= 8.17.0 (12.14.0 is advised for updated dependencies)
*  mongodb 4.2.x
*  *BitcoinSubsidiumd


### Preparing the server

Install latest updates:

    sudo apt update && sudo apt -y upgrade

When all updates are installed, reboot the server

    sudo reboot

Install needed depencies and remove all unused packages

    sudo apt -y install git htop screen unzip libkrb5-dev nginx nano gnupg software-properties-common && sudo apt -y autoremove --purge

When it’s done, reboot the server

    sudo reboot

Install BitcoinSubsidium ( latest version can be retrieved from https://github.com/phoenixkonsole/xbtx )

    under /root/ or /home/ do
    mkdir xbtx
    wget https://github.com/phoenixkonsole/xbtx/releases/download/7/XBTX_Linux_x64.zip
    unzip XBTX_Linux_x64.zip

### Running the deamon

Now it's time to run the daemon, we will need to this 2 times because there is no "stop" currently on the deamon:

     ( /home/ or /root/ where you have wget the zipfile) /home/xbtx/BitcoinSubsidiumd -daemon -txindex -server -listen

The daemon will create a folder under /root/.BitcoinSubsidium and under this folder there might be a file BitcoinSubsidium.conf, this is a very important file!
Use no special characters for the username and password! Only the local host have rpc access, so the username and password mustn’t be very difficult and long. 

    cd /root/.BitcoinSubsidium
    sudo nano BitcoinSubsidium.conf

In this file put the information from below (note the information down because you will need it later!)
    rpcuser=username
    rpcpassword=password
    server=1
    txindex=1

rpcallowip=127.0.0.1 is allowed by default from the xbtx code so this is not needed to be added and the default port is 8766, if you want to change this default rpc port do 

    rpcport=coin rpc port

Save the changes by doing control + X and y and then because we cannot stop start the daemon do

    sudo reboot now

After reboot restart the daemon again and check it on a regular basis via 

    ./BitcoinSubsidium-cli getblockchaininfo 

Blocks and headers will be incrementing and you can continue with the rest but best is to wait when both parameters are on the same height. 

### Install & create database

Install Mongodb (I have seen many alternatives here, and this one is the only one that did not gave me any issue) , I have chosen to go for the latest version of mongo 4.4 currently 

    sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 656408E390CFB1F5
    echo "deb [ arch=amd64 ] https://repo.mongodb.org/apt/ubuntu bionic/mongodb-org/4.4 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb.list
    sudo apt update
    sudo apt install mongodb-org
    sudo systemctl enable mongod.service
    sudo systemctl start mongod.service

After install check the service by 

    sudo systemctl status mongodb

Enter MongoDB cli:

    mongo

Create databse:

    use explorerdb

Create user with read/write access (note the credentials down because you need it later!):

    db.createUser( { user: "your username", pwd: "your password", roles: [ "readWrite" ] } )

*Note: If you're using mongo shell 4.2.x, use the following to create your user:

    db.addUser( { user: "username", pwd: "password", roles: [ "readWrite"] })
    exit

### Install Node.js and NPM

Install nodejs and Npm via: 
    
    sudo apt update && sudo apt -y install build-essential nodejs npm


### Get the source

    cd /home/
    git clone https://github.com/meligo/BitcoinSubsidiumExplorer.git explorer

### Install node modules

    cd explorer && npm install --production

### Configure

    cp ./settings.json.template ./settings.json

Check that you have the directory “tmp” in the explorer directory. When not, create it.
    
    mkdir tmp

### Make required changes in settings.json

I did most of the settings already for you to be able to work with the BitcoinSubsidium network.
    
    "title": "BitcoinSubsidumExplorer",
    "address": "127.0.0.1:3001", –> "address": "explorer.yourdomain.com",

    // database settings (MongoDB)
    "dbsettings": {
    "user": "your DB username",
    "password": "your DB password",
    "database": "explorerdb",
    "address": "localhost",
    "port": 27017
    },

    this is already set to 12 (4 core server) but if it's giving issues please set it back to 1
    "block_parallel_tasks": 1, –> Set this value to 12. It’s speeds up the sync.
    Best is to test this setting , stop the npm start service by control+X or control+c , change value and test
    if the setting is too high you will see an error when you do "npm start" , means the value was too high. 
    finding the sweet spot here will speed up the syncing.
    Once this setting is found, do not do "npm start" anymore, but start the explorer with pm2 (install of pm2 can be found lower in the readme)

    "wallet": {
    "host": "localhost",
    "port": 8766, //or your own rpc port 
    "username": "your username",
    "password": "your password"
    },

You can look at the rest of the settings and change if you want :-) 


### Start Explorer

DO NOT START FROM YOUR NORMAL CONSOLE, very sorry about the capitals but this is a long running operation and will block any future commands
During the setup of the server you have installed screen, this will help you A LOT

    screen -S explorer //this will create a virtual screen so that you can leave any long running operation open 
    
    it can be that you need to go back to the explorer path

    cd /home/explorer/

    npm start

    now to exit the screen do control + A , (control +) D and you are back in your normal console 

*Note: mongod must be running to start the explorer*

As of version 1.4.0 the explorer defaults to cluster mode, forking an instance of its process to each cpu core. This results in increased performance and stability. Load balancing gets automatically taken care of and any instances that for some reason die, will be restarted automatically. For testing/development (or if you just wish to) a single instance can be launched with
    !only for development use!
    node --stack-size=10000 bin/instance

To stop the cluster you can use

    npm stop


### Not needed but for advanced users
You can create indexes to speed up the database. Stop the application with "Ctrl + C" , normally this is already done automagically
    
    if you are out of screen explorer just go back into the screen with 

    screen -r explorer
    
    mongo
    use explorerdb
    db.txes.createIndex({total: 1})
    db.txes.createIndex({total: -1})
    db.txes.createIndex({blockindex: 1})
    db.txes.createIndex({blockindex: -1})
    db.addresstxes.createIndex({a_id: 1, blockindex: -1})
    exit

start the application again 

    npm start

### Syncing databases with the blockchain

Open a second terminal session (don’t touch the first session). Now we will sync the explorer. Note: It depends on your blockchain size, this process can run hours or days!

    screen -S sync

    cd explorer //if you are not yet in the explorer dir
    
    node scripts/sync.js index update reindex

if everything went well you will start to see a large list with block id's and txid's. 
Meanwhile open web browser and check the frontend. http://explorer.yourdomain.com:3001

Wait now till the sync is done, don’t close any window. When the sync terminates, you will receive an exception and you have to Google what is the problem and how to fix it. For this we have no cookbook. With a correct working standard blockchain you will receive no problems.

When the chain is synced, you can sync the other components, it depends on your configuration.

    node scripts/sync.js market
    node scripts/peers.js

sync.js (located in scripts/) is used for updating the local databases. This script must be called from the explorers root directory.

    Usage: node scripts/sync.js [database] [mode]

    database: (required)
    index [mode] Main index: coin info/stats, transactions & addresses
    market       Market data: summaries, orderbooks, trade history & chartdata

    mode: (required for index database only)
    update       Updates index from last sync to current block
    check        checks index for (and adds) any missing transactions/addresses
    reindex      Clears index then resyncs from genesis to current block

    notes:
    * 'current block' is the latest created block when script is executed.
    * The market database only supports (& defaults to) reindex mode.
    * If check mode finds missing data(ignoring new data since last sync),
      index_timeout in settings.json is set too low.

### making sure that the explorer keeps running

### Process Manager 2 

We will make the application reboot safe and install as service. For this we’re using the “Process Manager 2” (PM2) tool.
Please be aware that you can run this in a "cluster mode" with some loadbalancing, make sure how many cpu's your server has. 
If you have 4 cpu's then it's best to task to 2 cpu's. This will speed up the syncing considerably. 
Stop the application in your 1st terminal with "Ctrl + C" , not the syncing but the other screen -r explorer.

    sudo npm install -g pm2
    sudo pm2 start bin/cluster -i 2
    sudo env PATH=$PATH:/usr/local/bin pm2 startup
    sudo pm2 save && sudo systemctl daemon-reload && systemctl start pm2-root (root is what you see when you started the cluster , it's in the "user" tab)

Check that the serice is up and running.

    sudo systemctl status pm2-root

!Important commands to stop, start, restart, monitor the explorer application!

    pm2 stop
    pm2 start
    pm2 restart
    pm2 monit

### cron

We will automate the scripts via cron, do set the explorer path to the correct one
*Example crontab; update index every minute and market data every 2 minutes*

    sudo crontab -e
    */1 * * * * cd /home/explorer && /usr/bin/nodejs scripts/sync.js index update > /dev/null 2>&1
    */2 * * * * cd /home/explorer && /usr/bin/nodejs scripts/sync.js market > /dev/null 2>&1
    */5 * * * * cd /home/explorer && /usr/bin/nodejs scripts/peers.js > /dev/null 2>&1

Adjust the first numbers to how fast it should sync the information in minutes, so now we are syncing the blockchain every minute
*It is recommended to have this script launched via a cronjob at 1+ min intervals.*

### now it's time to secure this server

### Nginx reverse proxy for security to run the app under port 80/443

We will remove the default nginx configuration and create a new one.

    sudo apt-get install nginx
    sudo rm /etc/nginx/sites-enabled/default
    sudo nano /etc/nginx/sites-available/explorer

Paste the config into the new file and change the server name with your URL.

    server {
        listen 80;
        server_name explorer.yourdomain.com;

        location / {
            proxy_set_header   X-Forwarded-For $remote_addr;
            proxy_set_header   Host $http_host;
            proxy_pass         "http://127.0.0.1:3001";
        }
    }

We will link our new nginx config.

    sudo ln -s /etc/nginx/sites-available/explorer /etc/nginx/sites-enabled/explorer

And start the nginx reverse proxy.

    sudo systemctl start nginx

    Check: http://explorer.yourdomain.com


### secure with firewall 

We will close all ports, except the ssh, http and https port. If you haven't started the firewall yet and are connected via SSH do the following steps, if you just activate the firewall without this first step you better have VNC to enter the server otherwise you will get kicked. 

    Command ufw default allow will set default policy to allow, this will allow everything connection from any port to your server after your firewall is enabled. 
    
    sudo ufw default allow

    Enable your firewall by enable command, it will start the firewall using your settings. 

    sudo ufw enable
    
    Command ufw allow 22/tcp will allow all incoming TCP (not UDP)  connections to port 22 used for SSH. 

    sudo ufw allow 22/tcp     //if you have another port for SSH use that one 
    
    or if you really want to be secure 

    ufw limit 22/tcp comment "Limit SSH "
    ufw allow 22/tcp comment "SSH"
    

    Command ufw default deny will change the default policy, so all incoming connections will be denied / rejected unless defined in firewall otherwise. This is opposite of the first command, it is a much safer choice to leave only used ports open to avoid security breach. 
    sudo ufw default deny

    now to open the other ports (if you are only going to use httpS)

    ufw allow http comment "HTTP"
    ufw allow https comment "HTTPS"


### Create a https certificate with Let’s Encrypt

Here an example to create a https certificate with Let’s Encrypt to have a secure browser session.
Add the certbot package repo. Press Enter to accept the key.

    sudo add-apt-repository ppa:certbot/certbot
    sudo apt install python-certbot-nginx


Obtaining an SSL Certificate. Replace the URL with yours.

    sudo certbot --nginx -d explorer.yourdomain.com


If that’s successful, certbot will ask how you’d like to configure your HTTPS settings. Choose here the option “2”.

    Output
    Please choose whether or not to redirect HTTP traffic to HTTPS, removing HTTP access.
    -------------------------------------------------------------------------------
    1: No redirect - Make no further changes to the webserver configuration.
    2: Redirect - Make all requests redirect to secure HTTPS access. Choose this for
    new sites, or if you're confident your site works on HTTPS. You can undo this
    change by editing your web server's configuration.
    -------------------------------------------------------------------------------
    Select the appropriate number [1-2] then [enter] (press 'c' to cancel):
    -------------------------

Verifying Certbot Auto-Renewal

    sudo certbot renew --dry-run

Now you have a running explorer with https security. We need to close the http port in the firewall, because we only want to accept http traffic.

    sudo ufw status numbered
    sudo ufw delete number from your http rule (IP v4 and IP v6 you have to delete)

Finally you can configure the design and the correct API links. Switch trough the templates and choose what you like, replace the logo and the favicon.

To set the API links correct, choose a block and fill the settings.conf with the relevant values from your chain.

Create in /public a file “robots.txt” to prevent that the web crawlers index the explorer into public search engines.

    sudo nano robots.txt
    
    User-agent: *
    Disallow: /address
    Disallow: /api
    Disallow: /transaction


When you reboot, make very very sure your BitcoinSubsidiumD daemon is up and running, else you will not see anything happening on explorer.yourdomain.com.


### if you have issues that the JS is not kept running 

    Install Forever to keep the js running
    # sudo npm install forever -g
    # sudo npm install forever-monitor

### Troubleshooting - Known Issues

**script is already running.**

If you receive this message when launching the sync script either a) a sync is currently in progress, or b) a previous sync was killed before it completed. If you are certian a sync is not in progress remove the index.pid and db_index.pid from the tmp folder in the explorer root directory.

    rm tmp/index.pid
    rm tmp/db_index.pid

**exceeding stack size**

    RangeError: Maximum call stack size exceeded

Nodes default stack size may be too small to index addresses with many tx's. If you experience the above error while running sync.js the stack size needs to be increased.

To determine the default setting run

    node --v8-options | grep -B0 -A1 stack_size

To run sync.js with a larger stack size launch with

    node --stack-size=[SIZE] scripts/sync.js index update

Where [SIZE] is an integer higher than the default.

*note: SIZE will depend on which blockchain you are using, you may need to play around a bit to find an optimal setting*

**clean the mongoDB**

You can drop the mongo db with the following commands. It’s required it the db is corrupt.

    mongo
    use explorerdb
    db.addresses.remove({})
    db.addresses.drop()
    db.coinstats.remove({})
    db.coinstats.drop()
    db.markets.remove({})
    db.markets.drop()
    db.peers.remove({})
    db.peers.drop()
    db.richlists.remove({})
    db.richlists.drop()
    db.txes.remove({})
    db.txes.drop()
    exit

### License

Copyright (c) 2015, Iquidus Technology  
Copyright (c) 2015, Luke Williams  
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice, this
  list of conditions and the following disclaimer.

* Redistributions in binary form must reproduce the above copyright notice,
  this list of conditions and the following disclaimer in the documentation
  and/or other materials provided with the distribution.

* Neither the name of Iquidus Technology nor the names of its
  contributors may be used to endorse or promote products derived from
  this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

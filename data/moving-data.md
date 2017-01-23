--Backup the db from the bin folder
tar -czf sidepiece-12117.gz ../data/databases

--Restore the data / (May need to delete the databases folder prior to running??)
tar -Pxzf sidepiece-12117.gz

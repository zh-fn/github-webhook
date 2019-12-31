
echo start execute init_repo.sh
echo init_repo.sh - deploy path : $1
echo init_repo.sh - git repo url : $2

if [ ! -d $1 ]; then
	echo build.sh - deploy path [$1] doesn\'t exist, create it...
	mkdir -p $1
fi

cd $1;
cd  ../;
git clone $2;

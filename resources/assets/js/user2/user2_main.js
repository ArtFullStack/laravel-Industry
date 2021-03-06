const log = console.log;

$(document).ready(function(){

    const fn = {
        accessFertilizer:()=>accessFertilizer(),
        exitFertilizer:()=>exitFertilizer(),
        fertilizerHistory:()=>fertilizerHistory(),
        fertilizers:()=>fertilizers()
    };
    if(sessionStorage.url){
        let f = getfn(sessionStorage.url);
        fn[f]();
    }else{
        fertilizers();
    }
    function getfn(){
        return sessionStorage.url.split('/').pop().split('_').shift();
    }
    function removeActive(){
        if(sessionStorage.url) {
            $('#' + getfn(sessionStorage.url)).removeClass('active');
            return true;
        }
        return false;
    }
    events();
    function events() {
        $('#fertilizers').off('click').on('click',fertilizers);
        $('#accessFertilizer').off('click').on('click',accessFertilizer);
        $('#exitFertilizer').off('click').on('click',exitFertilizer);
        $('#fertilizerHistory').off('click').on('click',fertilizerHistory);
    }

    function fertilizers(){

        $('#fertilizers').off('click');
        let url = 'user2/fertilizers_get';
        $.get(url, function(response){
            removeActive();
            $('#content').html(response);
            $('#fertilizers').addClass('active');
            sessionStorage.setItem('url',url);
        })
            .then(()=> fertilizersData())
            .then(()=> $('#fertilizers').off('click').on('click', fertilizers))
            .fail(errors);
    }
    function fertilizersData() {
        $('#fertilizers_table').grid('destroy', true, true);
        let grid = $('#fertilizers_table').grid({
            dataSource: {url: 'user2/fertilizers_data', type: 'post', success: response => grid.render(sortByName(response))},
            fontSize: 15,
            responsive: true,
            height: 700,
            fixedHeader: true,
            notFoundText: 'Արդյունք չի գտնվել',
            columns: [
                { field: 'good_name', title: 'Անուն <i class="fas fa-sort"></i>'},
                { field: 'good_unit', title: 'Միավոր <i class="fas fa-sort"></i>'},
                { field: 'good_balance', title: 'Քանակ <i class="fas fa-sort"></i>'},
            ],
        });
    }

    function accessFertilizer(){
        $('#accessFertilizer').off('click');
        let url = 'user2/accessFertilizer_get';
        $.get(url, function (response) {
            removeActive();
            sessionStorage.setItem('url', url);
            $('#accessFertilizer').addClass('active');
            $('#content').html(response);
        })
            .then(()=> accessData())
            .then(()=> $('#accessFertilizer').off('click').on('click', accessFertilizer))
            .fail(errors);
    }
    function accessData(){

        $('#access_fertilizer_table').grid('destroy', true, true);
        let grid = $('#access_fertilizer_table').grid({
            dataSource: {url: 'user2/accessFertilizer_data', success: onSuccessFunction },
            primaryKey: 'supplier_id',
            responsive: true,
            detailTemplate: '<div><table  style="background: #fcf8e3"></div>',
            notFoundText: 'Արդյունք չի գտնվել',
            fixedHeader: true,
            fontSize: 15,
            height: 620,
            columns: [
                {field: 'supplier_name', title: 'Անուն'},
                {field: 'date', title: 'Ամսաթիվ'},
                {
                    tmpl: '<button class="btn_access_fertilizer" data-products = "{product_keys}" data-id="{supplier_id}">Հաստատել</button><button class="return_to_review" data-paid="{paid}"  data-id="{supplier_id}">Ուղարկել վերանայման</button>',
                    align: 'right',
                    cssClass: 'fa_button'
                },
            ]
        });

        function onSuccessFunction(response){

            let record = [];
            let product_keys = [];
            $.each(response, function (k, value) {
                product_keys = [];
                $.each(value, function (v, item) {
                    item.id = item.supplier_id;
                    product_keys.push(item.good_id)
                });
                value[0].product_keys = product_keys.join();
                record.push(value[0])
            });
            grid.render(record);
            let opacTr = $('#access_fertilizer_table').find('button[data-paid=2]').closest('tr');
            opacTr.css('opacity', '.6').find('*').off();
            opacTr.find('.fa_button div').css('padding', '15px').text('Ուղարկված է վերանայման');


            $('.btn_access_fertilizer').off('click').on('click', function () {
                let id = $(this).data('id'), product_keys = $(this).data('products');
                FadeInModal({
                    body: 'Հաստատել ապրանքի մուտքը',
                    footer: '<button type="button" class="btn btn-default" data-dismiss="modal">Ոչ</button> ' +
                        '<button type="button" id="confirm_access_good" class="btn btn-primary" data-dismiss="modal">Այո</button>',
                    success: () => {
                        $('#confirm_access_good').off('click').on('click', function () {
                            $.post('user2/confirm_access_fertilizer', { id, product_keys }, function (response) {
                                if (response.status == 'success') {
                                    grid.reload();
                                }
                            })
                        });
                    }
                });

            });
            $('.return_to_review').off('click').on('click', function () {
                let id = $(this).data('id');
                FadeInModal({
                    body: 'Ուղարկել վերանայման',
                    footer: '<button type="button" id="confirm_access_good" class="btn btn-primary" data-dismiss="modal">Այո</button>' +
                        '<button type="button" class="btn btn-default" data-dismiss="modal">Ոչ</button>',
                    success: () => {
                        $('#confirm_access_good').off('click').on('click', function () {
                            $.post('user2/return_to_review', { id }, function (response) {
                                if (response.status == 'success') {
                                    grid.reload();
                                }
                            })
                        });
                    }
                });
            })
        }

        grid.on('detailExpand', function (e, $detailWrapper, id) {
            let detail = $detailWrapper.find('table').grid({
                dataSource: {
                    url: 'user2/accessFertilizer_data/'+id, success: function (response) {
                        log(response);
                        detail.render(response);

                    }
                },
                fixedHeader: true,
                responsive: true,
                fontSize: 15,
                notFoundText: 'Արդյունք չի գտնվել',
                columns: [
                    {field: 'good_name', title: 'Ապրանք'},
                    {field: 'good_unit', title: 'Միավոր'},
                    {field: 'good_amt', title: 'Քանակ'},
                ],
            });
        });



    }

    function exitFertilizer(){
        let url = 'user2/exitFertilizer_get';
        $.get(url, function (response) {
            removeActive();
            sessionStorage.setItem('url', url);
            $('#content').html(response);
            $('#exitFertilizer').addClass('active');
        }).then(()=> exitData())
            .then(()=> $('#exitFertilizer').off('click').on('click', exitFertilizer))
            .fail(errors);
    }
    function exitData(){

                $('#exit_fertilizer_table').grid('destroy', true, true);
                let grid = $('#exit_fertilizer_table').grid({
                    dataSource: {url: 'user2/exitFertilizer_data', type: 'post', success: function (response) {
                            grid.render(sortByName(response))
                        }},
                    primaryKey: 'good_id',
                    responsive: true,
                    fixedHeader: true,
                    height: 630,
                    fontSize: 15,
                    notFoundText: 'Արդյունք չի գտնվել',
                    columns:[
                        {field: 'good_name', title: 'Անուն'},
                        {field: 'good_unit', title: 'Միավոր'},
                        {tmpl: '<input class="num_input" data-balance="{good_balance}" data-id="{good_id}"/>', title: 'Քանակ'},
                        {field: 'good_balance', title: 'Մնացորդ'}

                    ]
                });

                $('#btn_exit_fertilizer_table').off('click').on('click', function () {

                    let message = $('.exit_fertilizer_message'),
                        input_amt = $('#exit_fertilizer_table input'),
                        obj = [],
                        error_id = [],
                        error = false;

                    input_amt.removeClass('product_not_enough');
                        $.each(input_amt, function(){
                            let fertilizer_id = $(this).attr('data-id');
                            let amt =  $(this).val();
                            let balance = $(this).attr('data-balance');

                            if (amt !== '' && amt > 0 ) {
                                obj.push({
                                    id: fertilizer_id,
                                    amt: -amt,
                                });
                                if ((balance - amt) < 0 ){
                                    error_id.push(fertilizer_id);
                                }
                            }
                        });
                        if (obj.length == 0){
                            error = true;
                            message.text('Լրացրեք քանակ');
                        }

                        $.each(error_id, function(x){
                            let not = $('#exit_fertilizer_table input[data-id='+ error_id[x] +']');
                            message.text('Լրացրել եք մնացորդից ավել քանակ');
                            not.addClass('product_not_enough');
                            error = true

                        });
                        if (!error){
                            $.ajax({
                                url: 'user2/posts',
                                type: 'post',
                                data: {data: obj},
                                success: function (response) {
                                    if (response.status == 'success') {
                                        message.text('Ելքերը հաջողությամբ կատարվեցին');
                                        grid.reload();
                                    }
                                },
                                error: errors
                            });
                        }
                })
    }

    function fertilizerHistory() {
        let url = 'user2/fertilizerHistory_get';
        $('#fertilizerHistory').off('click');
        removeActive();
        sessionStorage.setItem('url', url);
        $.get(url, function (response) {
            $('#content').html(response);
            $('#fertilizerHistory').addClass('active');
        })
        .then(()=> fertilizerHistoryData())
        .then(()=> $('#fertilizerHistory').off('click').on('click', fertilizerHistory))
        .fail(errors);

    }
    function fertilizerHistoryData(){

        $('#fertilizers_history_table').grid('destroy', true, true);
        let from = $('#history_from').val();
        let to = $('#history_to').val();
        let name = $('#history_search_name').val();
        let select = $('#fertilizer_history_drop_down');

        let selectBy = (access, exit, all)=>{
            switch (select.val()){
                case 'access':
                    return access;
                case 'exit':
                    return exit;
                default :
                    return all;
            }
        };

        let grid = $('#fertilizers_history_table').grid({
            primaryKey: 'id',
            dataSource: {url: 'user2/fertilizers_history_data', type: 'post', success: onSuccessGridFunction},
            fontSize: 15,
            fixedHeader: true,
            height: 555,
            notFoundText: 'Արդյունք չի գտնվել',
            params: {
                from: from,
                to: to,
                select: select.val(),
                name: name,
            },
            detailTemplate: '<div><table  style="background: #fcf8e3"></div>',
            responsive: true,
            columns: [
                { field: 'fertilizer_name', title: 'Անուն'},
                { field: 'fertilizer_unit', title: 'Միավոր'},
                { field: selectBy('access_sum','exit_sum','access_sum'), title: selectBy('Ընդհանուր մուտքեր','Ընդհանուր ելքեր','Ընդհանուր մուտքեր')},
                { field: selectBy('','','exit_sum'), title: selectBy('','','Ընդհանուր ելքեր')},
            ]
        });


        function onSuccessGridFunction(response) {

            let records = [];
            for( let x in response ){
                let access = 0, exit = 0;
                for (let j in response[x]){
                    response[x][j].id = response[x][j].fertilizer_id;
                    if (response[x][j].amt > 0){
                        access += +response[x][j].amt
                    }else{
                        exit += +response[x][j].amt
                    }
                }
                response[x][0].access_sum = access;
                response[x][0].exit_sum = Math.abs(exit);
                records.push(response[x][0])
            }
            grid.render(records);
        }
        grid.on('detailExpand', function (e, $detailWrapper, id) {

            let detail = $detailWrapper.find('table').grid({
                params: {
                    fertilizer_id: id,
                    from: from,
                    to: to,
                    select: select.val(),
                },
                dataSource: { url:'user2/fertilizers_history_data', type: 'post' },
                fixedHeader: true,
                responsive: true,
                fontSize: 15,
                notFoundText: 'Արդյունք չի գտնվել',
                columns: [
                    { field: 'date', title: 'Ամսաթիվ'},
                    { field: selectBy('access', 'exit', 'access'), title: selectBy('Մուտք', 'Ելք', 'Մուտք')},
                    { field: selectBy('', '', 'exit'), title: selectBy('', '', 'Ելք')},
                    { field: 'balance', title: 'Մնացորդ'},
                ],
            });
        });

        $('.box input').off('keypress').on('keypress', function(e){
            if(e.keyCode == 13) {
                return false
            }
        });
        $('.box input').off('input').on('input', fertilizerHistoryData);
        $('.box select, .box input').off('change').on('change', fertilizerHistoryData);

        $('#btn_exit_history_search_clear').off('click').on('click', fertilizerHistory);
    }


    function sortByName(obj){
        let sorter = obj.slice(0);
        sorter.sort(function(a,b) {
            let x = a.good_name.toLowerCase();
            let y = b.good_name.toLowerCase();
            return x < y ? -1 : x > y ? 1 : 0;
        });
        return sorter;
    }
    function FadeInModal({ body, footer, success }) {
        let modal = $('#notificationModal');
        modal.modal('show');
        modal.find('.modal-body').html(body);
        modal.find('.modal-footer').html(footer);
        success();
    }
    function errors(jqXHR, textStatus, errorThrown) {
        console.error("error occurred: " + textStatus, errorThrown, jqXHR);
    }



});